"""North-line compressor fleet.

Synthetic, with a known failure process, so the gate can be checked.
Each asset is one compressor. Readings are hourly. A failure, when it
happens, is preceded by a short vibration rise. Temperature crosses the
plant's 82°C limit only in the last few hours, and healthy compressors
also throw temperature spikes that are not failures.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

FEATURES = [
    "vibration_rms",
    "temperature_c",
    "pressure_bar",
    "current_a",
    "acoustic_db",
]
HORIZON_HOURS = 48
FLEET_NAME = "North line compressors"


@dataclass
class Fleet:
    name: str
    readings: pd.DataFrame
    horizon_hours: int
    features: list[str] | None = None
    snapshots: bool = False

    def feature_names(self) -> list[str]:
        return list(self.features) if self.features is not None else list(FEATURES)

    def assets(self, split: str) -> list[str]:
        ids = (
            self.readings.loc[self.readings["split"] == split, "asset_id"]
            .drop_duplicates()
            .tolist()
        )
        return ids


def _split_for(index: int) -> str:
    # 0-21 train, 22-27 calibration, 28-39 held out.
    # Held-out failures are the only failures the gate is allowed to see.
    if index >= 28:
        return "held_out"
    if index >= 22:
        return "calibration"
    return "train"


def generate_fleet(seed: int = 7) -> Fleet:
    rng = np.random.default_rng(seed)
    # Survivors are spread across train, calibration, and held-out.
    survivors = {2, 8, 15, 22, 31, 36}
    start = np.datetime64("2026-01-01T00:00")
    rows: list[dict] = []

    for i in range(40):
        asset = f"C-{i + 1:02d}"
        split = _split_for(i)
        base_vib = float(rng.uniform(0.9, 1.5))
        base_temp = float(rng.uniform(58.0, 66.0))
        base_pressure = float(rng.uniform(7.2, 7.8))
        base_current = float(rng.uniform(40.0, 46.0))
        base_acoustic = float(rng.uniform(66.0, 71.0))

        if i in survivors or i == 1:
            failure = None
            onset = None
            last = 30 if i == 1 else 720
        else:
            failure = int(rng.integers(320, 680))
            span = int(rng.integers(28, 44))
            onset = failure - span
            last = failure  # the failure hour itself is downtime, not a reading

        spike_hours = set(int(x) for x in rng.choice(720, size=6, replace=False))
        for hour in range(last):
            progress = 0.0
            if onset is not None and hour >= onset:
                progress = (hour - onset) / max(1, failure - onset)
            knee = max(0.0, progress - 0.30) ** 1.3
            vibration = base_vib + rng.normal(0, 0.07) + 7.2 * knee
            acoustic = base_acoustic + rng.normal(0, 0.4) + 15.0 * knee
            current = base_current + rng.normal(0, 0.35) + 5.5 * knee
            temperature = base_temp + rng.normal(0, 0.45)
            if progress > 0.82:
                temperature += 30.0 * (progress - 0.82) / 0.18
            pressure = 7.5 if i == 4 else base_pressure + rng.normal(0, 0.04)
            if hour in spike_hours and (onset is None or hour < onset):
                temperature += float(rng.uniform(26.0, 34.0))
            if rng.random() < 0.012:
                vibration = np.nan
            rows.append(
                {
                    "asset_id": asset,
                    "hour": hour,
                    "timestamp": start + np.timedelta64(hour, "h"),
                    "split": split,
                    "failure_hour": np.nan if failure is None else failure,
                    "vibration_rms": vibration,
                    "temperature_c": temperature,
                    "pressure_bar": pressure,
                    "current_a": current,
                    "acoustic_db": acoustic,
                }
            )

    frame = pd.DataFrame.from_records(rows)
    # One duplicated hour, so profiling has a real timestamp collision to flag.
    duplicate = frame[(frame["asset_id"] == "C-07") & (frame["hour"] == 10)].copy()
    frame = pd.concat([frame, duplicate], ignore_index=True)
    frame["timestamp"] = pd.to_datetime(frame["timestamp"])
    return Fleet(name=FLEET_NAME, readings=frame, horizon_hours=HORIZON_HOURS)
