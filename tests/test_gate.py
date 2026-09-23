import pytest

from promotegate.gate import Rules, decide
from promotegate.metrics import AlarmMetrics


def _metrics(failures=10, missed=2, false_hours=20, healthy=2000, leads=None):
    return AlarmMetrics(
        failures=failures,
        missed_failures=missed,
        false_alarm_hours=false_hours,
        healthy_hours=healthy,
        lead_hours=[18.0] if leads is None else leads,
    )


def test_too_few_failures_is_insufficient_and_does_not_compare():
    decision = decide(_metrics(failures=3, missed=1), _metrics(failures=3, missed=2), Rules())
    assert decision.verdict == "insufficient"
    assert "guess" in decision.summary.lower() or "not enough" in decision.summary.lower()


def test_equal_models_are_rejected_rather_than_promoted():
    same = _metrics()
    decision = decide(same, same, Rules())
    assert decision.verdict == "reject"
    assert any(check.name == "genuinely_better" and not check.passed for check in decision.checks)


def test_worse_miss_rate_rejects_even_with_a_longer_warning():
    candidate = _metrics(missed=5, leads=[30.0])
    incumbent = _metrics(missed=2, leads=[8.0])
    decision = decide(candidate, incumbent, Rules())
    assert decision.verdict == "reject"
    assert any(check.name == "missed_failures" and not check.passed for check in decision.checks)


def test_false_alarm_cap_rejects():
    candidate = _metrics(missed=1, false_hours=200, healthy=1000, leads=[20.0])
    incumbent = _metrics(missed=4, false_hours=10, healthy=1000, leads=[8.0])
    decision = decide(candidate, incumbent, Rules(max_false_alarm_rate=0.05, false_alarm_allowance=0.01))
    assert decision.verdict == "reject"
    assert any(check.name == "false_alarms" and not check.passed for check in decision.checks)


def test_longer_warning_at_the_same_catch_rate_promotes():
    candidate = _metrics(missed=2, false_hours=20, leads=[18.0])
    incumbent = _metrics(missed=2, false_hours=24, leads=[8.0])
    decision = decide(candidate, incumbent, Rules())
    assert decision.verdict == "promote"


def test_rules_are_not_mutated():
    rules = Rules()
    before = rules.to_dict()
    decide(_metrics(), _metrics(missed=4, leads=[7.0]), rules)
    assert rules.to_dict() == before


def test_rules_reject_a_negative_allowance():
    with pytest.raises(ValueError):
        Rules(false_alarm_allowance=-0.1).validate()
