import pandas as pd

from promotegate.metrics import score_alarms


def _frame(rows):
    return pd.DataFrame(rows)


def test_true_alarm_sets_lead_time_and_does_not_count_as_false():
    rows = []
    for hour in range(100):
        rows.append(
            {
                "asset_id": "A",
                "hour": hour,
                "score": 1.0 if hour == 90 else 0.0,
                "failure_hour": 100,
            }
        )
    metrics = score_alarms(_frame(rows), threshold=0.5, horizon_hours=48)
    assert metrics.failures == 1
    assert metrics.missed_failures == 0
    assert metrics.lead_hours == [10]
    # Hours 0..51 are more than 48h before the failure.
    assert metrics.healthy_hours == 52
    assert metrics.false_alarm_hours == 0


def test_alarm_outside_the_horizon_is_a_miss_and_a_false_alarm():
    rows = []
    for hour in range(100):
        rows.append(
            {
                "asset_id": "A",
                "hour": hour,
                "score": 1.0 if hour == 51 else 0.0,
                "failure_hour": 100,
            }
        )
    metrics = score_alarms(_frame(rows), threshold=0.5, horizon_hours=48)
    assert metrics.missed_failures == 1
    assert metrics.lead_hours == []
    assert metrics.false_alarm_hours == 1


def test_healthy_asset_alarms_count_as_false():
    rows = [
        {"asset_id": "B", "hour": hour, "score": 1.0 if hour == 3 else 0.0, "failure_hour": float("nan")}
        for hour in range(10)
    ]
    metrics = score_alarms(_frame(rows), threshold=0.5, horizon_hours=48)
    assert metrics.failures == 0
    assert metrics.false_alarm_hours == 1
    assert metrics.healthy_hours == 10
    assert metrics.false_alarm_rate == 0.1
