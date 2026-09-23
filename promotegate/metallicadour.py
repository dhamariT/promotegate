"""Turn METALLICADOUR recordings into one row per file.

The public set is a real ABB IRB 6660. Each CSV is a few seconds sampled at
25.6 kHz: three current channels, three force, three torque, three vibration.
The folder name is the label (healthy tool, damaged tool, or a drifted axis).
"""

from __future__ import annotations

import re
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd

from promotegate.dataset import Fleet

CHANNEL_NAMES = [
    "current_1",
    "current_2",
    "current_3",
    "force_x",
    "force_y",
    "force_z",
    "torque_x",
    "torque_y",
    "torque_z",
    "vibration_x",
    "vibration_y",
    "vibration_z",
]
STATS = ("mean", "std", "rms", "max")
ZIP_URL = (
    "http://ressources.ens2m.fr/openscience/DATA-PHM/IndustrialData/"
    "METALLICADOUR-Detection_and_Diagnostics_of_Multi-axis_Robot_Faults/"
    "METALLICADOUR-Detection_and_Diagnostics_of_Multi-axis_Robot_Faults.zip"
)


def feature_names() -> list[str]:
    return [f"{channel}_{stat}" for channel in CHANNEL_NAMES for stat in STATS] + [
        "cut_depth_mm",
        "cut_feed",
        "spindle_rpm",
    ]


def _is_fault(path: str) -> bool:
    lowered = path.lower()
    return "healthy" not in lowered


def _condition(path: str) -> str:
    parts = Path(path).parts
    return parts[-2] if len(parts) >= 2 else path


def _cut_settings(condition: str) -> dict[str, float]:
    match = re.search(
        r"(\d+(?:\.\d+)?)mm_(\d+(?:\.\d+)?)mm_mn_(\d+)rpm",
        condition,
    )
    if not match:
        return {"cut_depth_mm": np.nan, "cut_feed": np.nan, "spindle_rpm": np.nan}
    return {
        "cut_depth_mm": float(match.group(1)),
        "cut_feed": float(match.group(2)),
        "spindle_rpm": float(match.group(3)),
    }


def _summarize(values: np.ndarray) -> dict[str, float]:
    if values.size == 0:
        return {name: np.nan for name in feature_names()}
    if values.ndim == 1:
        values = values.reshape(-1, 1)
    width = min(values.shape[1], len(CHANNEL_NAMES))
    summary: dict[str, float] = {}
    for index, channel in enumerate(CHANNEL_NAMES):
        if index >= width:
            column = np.array([], dtype=float)
        else:
            column = values[:, index]
            column = column[np.isfinite(column)]
        if column.size == 0:
            mean = std = rms = peak = np.nan
        else:
            mean = float(column.mean())
            std = float(column.std())
            rms = float(np.sqrt(np.mean(column * column)))
            peak = float(np.max(np.abs(column)))
        summary[f"{channel}_mean"] = mean
        summary[f"{channel}_std"] = std
        summary[f"{channel}_rms"] = rms
        summary[f"{channel}_max"] = peak
    return summary


def _read_csv(raw: bytes) -> np.ndarray:
    text = raw.decode("utf-8", errors="ignore")
    if not text.strip():
        return np.empty((0, 0))
    sample = text[:400]
    separator = ";" if sample.count(";") > sample.count(",") else ","
    frame = pd.read_csv(
        pd.io.common.StringIO(text),
        sep=separator,
        header=None,
        engine="c",
        on_bad_lines="skip",
    )
    numeric = frame.apply(pd.to_numeric, errors="coerce")
    if numeric.shape[1] < 3:
        frame = pd.read_csv(
            pd.io.common.StringIO(text),
            sep=r"\s+",
            header=None,
            engine="python",
            on_bad_lines="skip",
        )
        numeric = frame.apply(pd.to_numeric, errors="coerce")
    return numeric.to_numpy(dtype=float)


def recordings_from_zip(zip_path: Path) -> pd.DataFrame:
    rows: list[dict] = []
    with zipfile.ZipFile(zip_path) as archive:
        names = [
            name
            for name in archive.namelist()
            if name.lower().endswith(".csv")
            and "__MACOSX" not in name
            and "/._" not in name
            and not Path(name).name.startswith("._")
        ]
        for name in names:
            with archive.open(name) as handle:
                values = _read_csv(handle.read())
            row = _summarize(values)
            row["asset_id"] = Path(name).stem + "-" + str(abs(hash(name)) % 10_000_000)
            row["source"] = name
            row["condition"] = _condition(name)
            row["group"] = row["condition"]
            row.update(_cut_settings(row["condition"]))
            row["is_fault"] = int(_is_fault(name))
            row["hour"] = 0
            row["failure_hour"] = 1.0 if row["is_fault"] else np.nan
            rows.append(row)
    frame = pd.DataFrame.from_records(rows)
    if frame.empty:
        raise RuntimeError(f"no CSV recordings found in {zip_path}")
    return _assign_splits(frame)


def _assign_splits(frame: pd.DataFrame) -> pd.DataFrame:
    """Hold out recordings, not whole setups.

    Every cutting setup contains healthy and faulty passes. The gate should see
    new passes of a setup the model has already trained on. Holding out an
    entire setup made the model memorize recipes instead of faults.
    """
    rng = np.random.default_rng(7)
    frame = frame.copy()
    frame["split"] = "train"
    for _, group in frame.groupby(["condition", "is_fault"], sort=False):
        index = group.index.to_numpy().copy()
        rng.shuffle(index)
        count = len(index)
        hold = max(1, int(round(count * 0.25))) if count >= 4 else (1 if count >= 3 else 0)
        frame.loc[index[:hold], "split"] = "held_out"
    return frame


def load_fleet(zip_path: Path, cache_path: Path | None = None) -> Fleet:
    if cache_path is not None and cache_path.exists():
        readings = pd.read_csv(cache_path)
    else:
        readings = recordings_from_zip(zip_path)
        if cache_path is not None:
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            readings.to_csv(cache_path, index=False)
    return Fleet(
        name="ABB IRB 6660, METALLICADOUR",
        readings=readings,
        horizon_hours=1,
        features=feature_names(),
        snapshots=True,
    )


def vibration_limit(frame: pd.DataFrame):
    """Production stand-in: alarm when vibration RMS is high. Fit on train rows only."""
    from promotegate.modeling import Scorer

    train = frame[frame["split"] == "train"]
    healthy = train.loc[train["is_fault"].eq(0), "vibration_x_rms"]
    if healthy.notna().sum() < 5:
        healthy = train["vibration_x_rms"]
    threshold = float(np.nanpercentile(healthy.to_numpy(dtype=float), 90))
    return Scorer(
        model_id="vibration-limit",
        name="Vibration RMS high-limit",
        kind="column_limit",
        threshold=threshold,
        column="vibration_x_rms",
    )
