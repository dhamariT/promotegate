from __future__ import annotations

import pandas as pd

from promotegate.dataset import FEATURES, Fleet


def profile_fleet(fleet: Fleet) -> dict:
    frame = fleet.readings
    features = fleet.feature_names()
    issues: list[dict] = []

    for feature in features:
        missing = float(frame[feature].isna().mean())
        if missing >= 0.005:
            issues.append(
                {
                    "severity": "warn",
                    "message": f"{feature} is missing on {missing * 100:.1f}% of hours.",
                }
            )

    for asset, group in frame.groupby("asset_id"):
        if not fleet.snapshots and len(group) < 48:
            issues.append(
                {
                    "severity": "warn",
                    "message": f"{asset} has only {len(group)} hours of history.",
                }
            )
        duplicated = int(group.duplicated(subset=["hour"]).sum())
        if duplicated:
            issues.append(
                {
                    "severity": "warn",
                    "message": f"{asset} has {duplicated} duplicated hour stamp.",
                }
            )
        for feature in features:
            if len(group) > 48 and group[feature].nunique(dropna=True) <= 1:
                issues.append(
                    {
                        "severity": "warn",
                        "message": f"{asset} {feature} is stuck at a single value.",
                    }
                )

    assets = frame["asset_id"].nunique()
    failed = frame.loc[frame["failure_hour"].notna(), "asset_id"].nunique()
    held = frame.loc[frame["split"] == "held_out"]
    held_failures = held.loc[held["failure_hour"].notna(), "asset_id"].nunique()
    issues.append(
        {
            "severity": "info",
            "message": (
                f"{failed} of {assets} assets fail in the record. "
                f"{held_failures} of those failures are held out for the gate. "
                "Row accuracy is not a promotion metric."
            ),
        }
    )

    return {
        "name": fleet.name,
        "rows": int(len(frame)),
        "assets": int(assets),
        "failed_assets": int(failed),
        "held_out_failures": int(held_failures),
        "horizon_hours": fleet.horizon_hours,
        "issues": issues,
    }
