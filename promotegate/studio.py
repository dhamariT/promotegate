"""Runs the workflow and keeps the audit record.

The agent may train and judge. It may not promote. Promotion is a separate
call, and it is refused unless the stored verdict is promote under the
rules that were pinned when that verdict was written.
"""

from __future__ import annotations

import json
import threading
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import numpy as np
import pandas as pd

from promotegate.dataset import generate_fleet
from promotegate.gate import Rules, decide
from promotegate.metrics import score_alarms
from promotegate.modeling import explain, temperature_limit, train_candidate
from promotegate.profile import profile_fleet


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _jsonable(value):
    if isinstance(value, dict):
        return {key: _jsonable(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_jsonable(item) for item in value]
    if isinstance(value, (np.floating, float)):
        value = float(value)
        if not np.isfinite(value):
            return None
        return value
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    return value


class Studio:
    def __init__(self, var_dir: Path):
        self.var_dir = var_dir
        self.var_dir.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self.rules = Rules()
        self.incumbent = temperature_limit()
        self.candidates: dict = {}
        self.profile = None
        self.transcript: list[str] = []
        self.explanations: dict = {}
        self.confidence: dict = {}
        self.evaluations: list[dict] = []
        self.audit: list[dict] = []
        self.fleet = None
        self._load_audit()

    def _audit_path(self) -> Path:
        return self.var_dir / "audit.jsonl"

    def _load_audit(self) -> None:
        path = self._audit_path()
        if not path.exists():
            return
        for line in path.read_text().splitlines():
            if line.strip():
                self.audit.append(json.loads(line))

    def _append_audit(self, record: dict) -> None:
        self.audit.append(record)
        with self._audit_path().open("a") as handle:
            handle.write(json.dumps(_jsonable(record)) + "\n")

    def state(self) -> dict:
        return _jsonable(
            {
                "rules": self.rules.to_dict(),
                "incumbent": {
                    "model_id": self.incumbent.model_id,
                    "name": self.incumbent.name,
                    "kind": self.incumbent.kind,
                    "threshold": self.incumbent.threshold,
                },
                "profile": self.profile,
                "transcript": self.transcript,
                "explanations": self.explanations,
                "confidence": self.confidence,
                "evaluations": self.evaluations,
                "audit": list(reversed(self.audit[-40:])),
            }
        )

    def update_rules(self, payload: dict) -> dict:
        with self._lock:
            self.rules = Rules.from_dict(payload)
            return self.state()

    def _score(self, scorer, frame: pd.DataFrame):
        scored = frame.copy()
        scored["score"] = scorer.scores(scored)
        return score_alarms(scored, scorer.threshold, self.fleet.horizon_hours), scored["score"].to_numpy()

    def run(self) -> dict:
        with self._lock:
            self.fleet = generate_fleet()
            self.profile = profile_fleet(self.fleet)
            holdout = self.fleet.readings[self.fleet.readings["split"] == "held_out"].copy()
            rules = Rules.from_dict(self.rules.to_dict())
            incumbent_metrics, _ = self._score(self.incumbent, holdout)

            built = []
            for kind in ("lightgbm", "xgboost"):
                scorer = train_candidate(self.fleet, kind)
                scorer.model_id = f"{kind}-{uuid4().hex[:8]}"
                self.candidates[scorer.model_id] = scorer
                built.append(scorer)
            built.append(_constant("always-alarm", "Always alarm", 1.0))
            built.append(_constant("never-alarm", "Never alarm", 0.0))

            self.evaluations = []
            self.explanations = {}
            self.confidence = {}
            for scorer in built:
                metrics, scores = self._score(scorer, holdout)
                decision = decide(metrics, incumbent_metrics, rules)
                record = {
                    "id": uuid4().hex[:12],
                    "created_at": _now(),
                    "candidate_id": scorer.model_id,
                    "candidate_name": scorer.name,
                    "incumbent_name": self.incumbent.name,
                    "threshold": scorer.threshold,
                    "rules": rules.to_dict(),
                    "candidate_metrics": metrics.to_dict(),
                    "incumbent_metrics": incumbent_metrics.to_dict(),
                    "decision": decision.to_dict(),
                    "promoted": False,
                }
                self.evaluations.append(record)
                self._append_audit(deepcopy(record))
                if scorer.kind in {"lightgbm", "xgboost"}:
                    train = self.fleet.readings[self.fleet.readings["split"] == "train"]
                    self.explanations[scorer.model_id] = explain(scorer, train)
                    self.confidence[scorer.model_id] = _confidence(holdout, scores, self.fleet.horizon_hours)

            self.transcript = _transcript(self.profile, self.incumbent.name, self.evaluations)
            return self.state()

    def promote(self, evaluation_id: str) -> dict:
        with self._lock:
            match = next((item for item in self.evaluations if item["id"] == evaluation_id), None)
            if match is None:
                raise KeyError(evaluation_id)
            if match["decision"]["verdict"] != "promote":
                raise PermissionError("This verdict does not allow promotion.")
            if match["rules"] != self.rules.to_dict():
                raise PermissionError("Rules changed after this verdict. Run the gate again.")
            if match["promoted"]:
                raise PermissionError("This verdict was already used to promote.")
            scorer = self.candidates.get(match["candidate_id"])
            if scorer is None:
                raise KeyError(match["candidate_id"])
            self.incumbent = scorer
            match["promoted"] = True
            for saved in self.audit:
                if saved["id"] == evaluation_id:
                    saved["promoted"] = True
            self._rewrite_audit()
            self.transcript = self.transcript + [
                f"Promoted {scorer.name} into production. The previous model is no longer the incumbent."
            ]
            return self.state()

    def _rewrite_audit(self) -> None:
        with self._audit_path().open("w") as handle:
            for record in self.audit:
                handle.write(json.dumps(_jsonable(record)) + "\n")


def _constant(model_id: str, name: str, value: float):
    from promotegate.modeling import Scorer

    scorer = Scorer(model_id=model_id, name=name, kind="constant", threshold=0.5, model=None)
    scorer.scores = lambda frame, filled=value: np.full(len(frame), filled)  # type: ignore[method-assign]
    return scorer


def _confidence(frame: pd.DataFrame, scores: np.ndarray, horizon: int) -> dict:
    failure = frame["failure_hour"].to_numpy()
    hours = frame["hour"].to_numpy()
    window = np.isfinite(failure) & (hours >= failure - horizon) & (hours < failure)
    healthy = ~np.isfinite(failure) | (hours < failure - horizon)

    def _mean(mask):
        chosen = scores[mask]
        chosen = chosen[np.isfinite(chosen)]
        if len(chosen) == 0:
            return None
        return float(np.mean(chosen))

    return {"pre_failure_mean_score": _mean(window), "healthy_mean_score": _mean(healthy)}


def _pct(value) -> str:
    if value is None:
        return "n/a"
    return f"{float(value) * 100:.1f}%"


def _hours(value) -> str:
    if value is None:
        return "n/a"
    return f"{float(value):.1f}h"


def _transcript(profile: dict, incumbent_name: str, evaluations: list[dict]) -> list[str]:
    lines = [
        (
            f"Profiled {profile['name']}: {profile['assets']} compressors, "
            f"{profile['rows']} hourly readings, horizon {profile['horizon_hours']}h."
        )
    ]
    for issue in profile["issues"]:
        if issue["severity"] == "warn":
            lines.append("Data: " + issue["message"])
    lines.append(f"Production model under test is {incumbent_name}.")
    lines.append(
        "Trained LightGBM and XGBoost on the train compressors. "
        "Alarm thresholds were set on the training compressors only, under a 2% false-alarm cap. Held-out failures were not used."
    )
    eligible = []
    for record in evaluations:
        metrics = record["candidate_metrics"]
        decision = record["decision"]["verdict"]
        lines.append(
            f"{record['candidate_name']}: missed {_pct(metrics['missed_failure_rate'])}, "
            f"false alarms {_pct(metrics['false_alarm_rate'])}, "
            f"median lead {_hours(metrics['median_lead_hours'])}. Verdict: {decision}."
        )
        if decision == "promote":
            eligible.append(record)
    if eligible:
        pick = max(eligible, key=lambda item: item["candidate_metrics"]["median_lead_hours"] or 0)
        lines.append(
            f"{pick['candidate_name']} earns promotion. It stays off production until you confirm."
        )
    else:
        lines.append("No candidate earned promotion. Production is unchanged.")
    return lines
