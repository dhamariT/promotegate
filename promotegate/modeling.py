"""Candidate trainers and the production temperature limit.

Thresholds for learned models are chosen on the calibration assets only,
under a false-alarm cap. Held-out compressors are not used here.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.utils.class_weight import compute_sample_weight
from xgboost import XGBClassifier

from promotegate.dataset import FEATURES, Fleet
from promotegate.metrics import score_alarms

TEMPERATURE_LIMIT_C = 82.0
FAR_CAP = 0.03


@dataclass
class Scorer:
    model_id: str
    name: str
    kind: str
    threshold: float
    model: object | None = None

    def scores(self, frame: pd.DataFrame) -> np.ndarray:
        if self.kind == "temperature_limit":
            return frame["temperature_c"].to_numpy(dtype=float)
        features = frame[FEATURES]
        probability = self.model.predict_proba(features)[:, 1]
        return np.asarray(probability, dtype=float)


def temperature_limit() -> Scorer:
    return Scorer(
        model_id="temperature-limit",
        name="Temperature high-limit, 82°C",
        kind="temperature_limit",
        threshold=TEMPERATURE_LIMIT_C,
    )


def _labels(frame: pd.DataFrame, horizon: int) -> np.ndarray:
    failure = frame["failure_hour"]
    hours = frame["hour"]
    positive = failure.notna() & (hours >= failure - horizon) & (hours < failure)
    return positive.astype(int).to_numpy()


def choose_threshold(frame: pd.DataFrame, scores: np.ndarray, horizon: int, far_cap: float = FAR_CAP) -> float:
    finite = scores[np.isfinite(scores)]
    if len(finite) == 0:
        return 1.0
    grid = np.unique(np.quantile(finite, np.linspace(0.02, 0.98, 49)))
    best_threshold = float(grid[-1])
    best_key = None
    work = frame.copy()
    work["score"] = scores
    for threshold in grid:
        metrics = score_alarms(work, float(threshold), horizon)
        if metrics.false_alarm_rate is None or metrics.missed_failure_rate is None:
            continue
        under_cap = metrics.false_alarm_rate <= far_cap
        key = (
            0 if under_cap else 1,
            metrics.missed_failure_rate,
            -(metrics.median_lead_hours or 0.0),
            metrics.false_alarm_rate,
        )
        if best_key is None or key < best_key:
            best_key = key
            best_threshold = float(threshold)
    return best_threshold


def _fit_tree(kind: str, features: pd.DataFrame, labels: np.ndarray):
    if kind == "lightgbm":
        model = LGBMClassifier(
            n_estimators=160,
            learning_rate=0.05,
            num_leaves=15,
            min_child_samples=30,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=7,
            verbosity=-1,
            n_jobs=1,
        )
        weights = compute_sample_weight("balanced", labels)
        model.fit(features, labels, sample_weight=weights)
        return model
    negatives = max(1, int((labels == 0).sum()))
    positives = max(1, int((labels == 1).sum()))
    model = XGBClassifier(
        n_estimators=160,
        learning_rate=0.05,
        max_depth=3,
        min_child_weight=8,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="binary:logistic",
        eval_metric="logloss",
        scale_pos_weight=negatives / positives,
        random_state=7,
        n_jobs=1,
    )
    model.fit(features, labels)
    return model


def train_candidate(fleet: Fleet, kind: str) -> Scorer:
    if kind not in {"lightgbm", "xgboost"}:
        raise ValueError(f"unknown model kind {kind}")
    train = fleet.readings[fleet.readings["split"] == "train"]
    if train.empty:
        raise ValueError("fleet is missing a train split")
    model = _fit_tree(kind, train[FEATURES], _labels(train, fleet.horizon_hours))
    scorer = Scorer(
        model_id=kind,
        name="LightGBM" if kind == "lightgbm" else "XGBoost",
        kind=kind,
        threshold=0.5,
        model=model,
    )
    # Thresholds are chosen on training compressors only. Held-out failures stay unseen.
    train_scores = scorer.scores(train)
    scorer.threshold = choose_threshold(train, train_scores, fleet.horizon_hours, far_cap=0.02)
    return scorer


def _gain(scorer: Scorer) -> list[dict]:
    booster = getattr(scorer.model, "feature_importances_", None)
    if booster is None:
        return []
    order = np.argsort(booster)[::-1]
    return [
        {"name": FEATURES[int(index)], "mean_abs_shap": float(booster[int(index)])}
        for index in order
        if booster[int(index)] > 0
    ]


def explain(scorer: Scorer, frame: pd.DataFrame, limit: int = 400) -> dict:
    if scorer.kind == "temperature_limit":
        return {
            "model_id": scorer.model_id,
            "note": "The production limit uses temperature only. It has no other features to explain.",
            "features": [{"name": "temperature_c", "mean_abs_shap": 1.0}],
        }
    try:
        import shap

        sample = frame[FEATURES].tail(limit)
        explainer = shap.TreeExplainer(scorer.model)
        values = explainer.shap_values(sample)
        if isinstance(values, list):
            values = values[-1]
        values = np.asarray(values)
        if values.ndim == 3:
            values = values[:, :, -1]
        mean_abs = np.abs(values).mean(axis=0)
        order = np.argsort(mean_abs)[::-1]
        ranked = [
            {"name": FEATURES[int(index)], "mean_abs_shap": float(mean_abs[int(index)])}
            for index in order
        ]
        return {
            "model_id": scorer.model_id,
            "note": "Mean absolute SHAP on a sample of training hours.",
            "features": ranked,
        }
    except Exception as exc:
        return {
            "model_id": scorer.model_id,
            "note": f"SHAP was unavailable ({exc}). Showing built-in split importance instead.",
            "features": _gain(scorer),
        }
