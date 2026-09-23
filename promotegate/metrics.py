"""Maintenance metrics on held-out failures.

Row accuracy is not one of them. A true alarm is a score at or above the
threshold inside the horizon window before a failure, and strictly before
the failure hour. An alarm on a healthy hour (no failure inside the horizon)
is a false alarm. Lead time is the gap between the first true alarm and the
failure. Alarms earlier than the horizon are false alarms: they are too
early to be a maintenance warning under the pinned horizon.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict

import numpy as np
import pandas as pd


@dataclass
class AlarmMetrics:
    failures: int
    missed_failures: int
    false_alarm_hours: int
    healthy_hours: int
    lead_hours: list[float]

    @property
    def missed_failure_rate(self) -> float | None:
        if self.failures == 0:
            return None
        return self.missed_failures / self.failures

    @property
    def false_alarm_rate(self) -> float | None:
        if self.healthy_hours == 0:
            return None
        return self.false_alarm_hours / self.healthy_hours

    @property
    def median_lead_hours(self) -> float | None:
        if not self.lead_hours:
            return None
        return float(np.median(self.lead_hours))

    def to_dict(self) -> dict:
        payload = asdict(self)
        payload["missed_failure_rate"] = self.missed_failure_rate
        payload["false_alarm_rate"] = self.false_alarm_rate
        payload["median_lead_hours"] = self.median_lead_hours
        payload["caught_failures"] = self.failures - self.missed_failures
        return payload


def score_alarms(frame: pd.DataFrame, threshold: float, horizon_hours: int) -> AlarmMetrics:
    failures = 0
    missed = 0
    false_hours = 0
    healthy = 0
    leads: list[float] = []

    for _, group in frame.groupby("asset_id", sort=False):
        group = group.sort_values("hour")
        hours = group["hour"].to_numpy()
        scores = group["score"].to_numpy(dtype=float)
        failure = group["failure_hour"].iloc[0]
        alarmed = np.isfinite(scores) & (scores >= threshold)

        if pd.notna(failure):
            failures += 1
            failure = float(failure)
            in_window = (hours >= failure - horizon_hours) & (hours < failure)
            hits = np.where(in_window & alarmed)[0]
            if len(hits) == 0:
                missed += 1
            else:
                leads.append(float(failure - hours[hits[0]]))
            healthy_mask = hours < (failure - horizon_hours)
        else:
            healthy_mask = np.ones(len(hours), dtype=bool)

        healthy += int(healthy_mask.sum())
        false_hours += int((healthy_mask & alarmed).sum())

    return AlarmMetrics(
        failures=failures,
        missed_failures=missed,
        false_alarm_hours=false_hours,
        healthy_hours=healthy,
        lead_hours=leads,
    )
