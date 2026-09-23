"""The promotion gate.

Rules are an input. The gate does not loosen them to let a model through.
A candidate is promoted only when there are enough held-out failures to
judge it, it is not worse than the incumbent on missed failures, false
alarms, or lead time, and it is genuinely better on at least one of those.
Otherwise the verdict is reject, or insufficient when the evidence cannot
support a comparison.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict, field

from promotegate.metrics import AlarmMetrics


@dataclass
class Rules:
    min_held_out_failures: int = 8
    max_false_alarm_rate: float = 0.05
    false_alarm_allowance: float = 0.01
    min_median_lead_hours: float = 6.0
    max_lead_regression_hours: float = 2.0
    min_lead_improvement_hours: float = 1.0

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, payload: dict) -> "Rules":
        known = {key: payload[key] for key in cls.__dataclass_fields__ if key in payload}
        rules = cls(**known)
        rules.validate()
        return rules

    def validate(self) -> None:
        if self.min_held_out_failures < 1:
            raise ValueError("min_held_out_failures must be at least 1")
        if not 0 <= self.max_false_alarm_rate <= 1:
            raise ValueError("max_false_alarm_rate must be between 0 and 1")
        if self.false_alarm_allowance < 0:
            raise ValueError("false_alarm_allowance cannot be negative")
        if self.min_median_lead_hours < 0 or self.max_lead_regression_hours < 0:
            raise ValueError("lead-time rules cannot be negative")
        if self.min_lead_improvement_hours < 0:
            raise ValueError("min_lead_improvement_hours cannot be negative")


@dataclass
class Check:
    name: str
    passed: bool
    detail: str

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Decision:
    verdict: str
    summary: str
    checks: list[Check] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "verdict": self.verdict,
            "summary": self.summary,
            "checks": [check.to_dict() for check in self.checks],
        }


def _pct(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value * 100:.1f}%"


def _hours(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value:.1f}h"


def decide(candidate: AlarmMetrics, incumbent: AlarmMetrics, rules: Rules) -> Decision:
    rules.validate()
    if candidate.failures != incumbent.failures:
        raise ValueError("candidate and incumbent must be scored on the same failures")

    if candidate.failures < rules.min_held_out_failures:
        check = Check(
            name="enough_failures",
            passed=False,
            detail=(
                f"{candidate.failures} held-out failures. The rule requires "
                f"{rules.min_held_out_failures} before a comparison is allowed."
            ),
        )
        return Decision(
            verdict="insufficient",
            summary="Not enough held-out failures to decide. The gate will not guess.",
            checks=[check],
        )

    checks: list[Check] = [
        Check(
            name="enough_failures",
            passed=True,
            detail=f"{candidate.failures} held-out failures, at least {rules.min_held_out_failures}.",
        )
    ]

    if candidate.false_alarm_rate is None or incumbent.false_alarm_rate is None:
        checks.append(
            Check(
                name="false_alarms",
                passed=False,
                detail="False-alarm rate is undefined because there are no healthy hours.",
            )
        )
        return Decision(
            verdict="insufficient",
            summary="False-alarm rate cannot be estimated. The gate will not guess.",
            checks=checks,
        )

    miss_ok = candidate.missed_failure_rate <= incumbent.missed_failure_rate
    checks.append(
        Check(
            name="missed_failures",
            passed=miss_ok,
            detail=(
                f"Candidate missed {_pct(candidate.missed_failure_rate)} "
                f"({candidate.missed_failures}/{candidate.failures}). "
                f"Incumbent missed {_pct(incumbent.missed_failure_rate)} "
                f"({incumbent.missed_failures}/{incumbent.failures}). "
                "Candidate must not miss more."
            ),
        )
    )

    far_cap = candidate.false_alarm_rate <= rules.max_false_alarm_rate + 1e-12
    far_vs = candidate.false_alarm_rate <= incumbent.false_alarm_rate + rules.false_alarm_allowance + 1e-12
    checks.append(
        Check(
            name="false_alarms",
            passed=far_cap and far_vs,
            detail=(
                f"Candidate false alarms {_pct(candidate.false_alarm_rate)}. "
                f"Incumbent {_pct(incumbent.false_alarm_rate)}. "
                f"Cap is {_pct(rules.max_false_alarm_rate)}, and the candidate may sit at most "
                f"{rules.false_alarm_allowance * 100:.1f} points above the incumbent."
            ),
        )
    )

    lead = candidate.median_lead_hours
    incumbent_lead = incumbent.median_lead_hours
    if lead is None:
        lead_ok = False
        lead_detail = "Candidate caught no failures, so lead time does not exist."
    else:
        floor_ok = lead + 1e-9 >= rules.min_median_lead_hours
        if incumbent_lead is None:
            regression_ok = True
            regression_text = "The incumbent caught none, so there is no lead time to regress from."
        else:
            regression_ok = lead + 1e-9 >= incumbent_lead - rules.max_lead_regression_hours
            regression_text = (
                f"Incumbent median lead is {_hours(incumbent_lead)}. "
                f"Candidate may be at most {rules.max_lead_regression_hours:.1f}h shorter."
            )
        lead_ok = floor_ok and regression_ok
        lead_detail = (
            f"Candidate median lead {_hours(lead)}. Floor is {rules.min_median_lead_hours:.1f}h. "
            + regression_text
        )
    checks.append(Check(name="lead_time", passed=lead_ok, detail=lead_detail))

    miss_better = candidate.missed_failure_rate < incumbent.missed_failure_rate
    far_better = candidate.false_alarm_rate + 1e-12 < incumbent.false_alarm_rate
    lead_better = (
        lead is not None
        and incumbent_lead is not None
        and lead >= incumbent_lead + rules.min_lead_improvement_hours
    ) or (
        lead is not None and incumbent_lead is None and lead >= rules.min_median_lead_hours
    )
    improved = miss_better or far_better or lead_better
    better_bits = []
    if miss_better:
        better_bits.append("fewer missed failures")
    if far_better:
        better_bits.append("fewer false alarms")
    if lead_better:
        better_bits.append("a longer warning")
    checks.append(
        Check(
            name="genuinely_better",
            passed=improved,
            detail=(
                "Better on " + ", ".join(better_bits) + "."
                if better_bits
                else "No material improvement on missed failures, false alarms, or lead time."
            ),
        )
    )

    labels = {
        "enough_failures": "enough held-out failures",
        "missed_failures": "missed failures",
        "false_alarms": "false alarms",
        "lead_time": "lead time",
        "genuinely_better": "a real improvement",
    }
    failed = [labels.get(check.name, check.name) for check in checks if not check.passed]
    if not failed:
        return Decision(
            verdict="promote",
            summary="The candidate is safer to run than the incumbent on the pinned rules.",
            checks=checks,
        )
    return Decision(
        verdict="reject",
        summary="The candidate does not earn promotion. It failed on " + ", ".join(failed) + ".",
        checks=checks,
    )
