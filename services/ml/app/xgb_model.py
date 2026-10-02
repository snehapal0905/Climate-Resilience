"""
Adapter for the trained XGBoost flood model from the ML teammate's repo
(github.com/Joel-Nadar/ml-model-pbl-project, python-ml/train_model.py).

It loads artifacts/flood_risk_model.joblib and translates between that model and the /predict
contract, so the API and dashboard need no model-specific code:

- Input: the 14 columns the model was trained on are derived from FloodFeatures + valid_for,
  using the same formulas as the teammate's feature_engineering.py.
- Output: the model's 3 classes (low/medium/high) map onto the platform's 4 risk levels, and
  per-prediction SHAP contributions become top_factors.
"""
import json
import os
from datetime import date
from pathlib import Path

import joblib
import numpy as np
import xgboost as xgb

from .schemas import Factor, FloodFeatures, RiskLevel

ARTIFACT_DIR = Path(os.getenv("MODEL_DIR", Path(__file__).resolve().parent.parent / "artifacts"))
MODEL_PATH = ARTIFACT_DIR / "flood_risk_model.joblib"
METADATA_PATH = ARTIFACT_DIR / "model_metadata.json"

# Column order the model was trained with.
FEATURE_COLUMNS = [
    "rainfall_24h", "rainfall_3d", "rainfall_7d", "rainfall_intensity",
    "api_index", "month", "is_monsoon_season",
    "latitude", "longitude", "rainfall_pct_of_seasonal_normal",
    "humidity", "temp_max", "temp_min", "temp_mean",
]

# Training used per-city monsoon months and seasonal rainfall for 5 cities. Every platform region
# is in Assam, so all of them use the Guwahati settings.
MONSOON_MONTHS = {6, 7, 8, 9}
SEASONAL_AVG_RAINFALL_MM = 1700
DAILY_SEASONAL_NORMAL_MM = SEASONAL_AVG_RAINFALL_MM / (len(MONSOON_MONTHS) * 30)

# Rule override the teammate's fastapi_service.py applies on top of the model: 2 of these met → high.
HIGH_RISK_THRESHOLDS = {"rainfall_24h": 30.0, "rainfall_3d": 107.0, "rainfall_7d": 206.0, "api_index": 239.0}
HIGH_PROBABILITY_OVERRIDE = 0.3

# The model has no "severe" class; a "high" prediction this confident is shown as severe.
SEVERE_SCORE = 0.8

# Model column → feature name the dashboard labels. Latitude and longitude are reported together.
FACTOR_NAMES = {
    "rainfall_24h": "rain_1d_mm",
    "rainfall_3d": "rain_3d_mm",
    "rainfall_7d": "rain_7d_mm",
    "temp_max": "temp_max_c",
    "temp_min": "temp_min_c",
    "temp_mean": "temp_mean_c",
    "latitude": "location",
    "longitude": "location",
}

_model = None
MODEL_VERSION = "xgb-not-loaded"


def available() -> bool:
    return MODEL_PATH.exists()


def load() -> None:
    global _model, MODEL_VERSION
    _model = joblib.load(MODEL_PATH)
    version = "unknown"
    if METADATA_PATH.exists():
        version = json.loads(METADATA_PATH.read_text(encoding="utf-8")).get("model_version", version)
    MODEL_VERSION = f"xgb-{version}"


def _row(f: FloodFeatures, valid_for: date) -> list[float]:
    missing = [name for name in ("api_index", "lat", "lon") if getattr(f, name) is None]
    if missing:
        raise ValueError(f"The XGBoost model needs these features: {', '.join(missing)}")
    hours = f.rain_hours_1d or 0.0
    t_max, t_min = f.temp_max_c or 0.0, f.temp_min_c or 0.0
    t_mean = f.temp_mean_c if f.temp_mean_c is not None else (t_max + t_min) / 2
    return [
        f.rain_1d_mm,
        f.rain_3d_mm,
        f.rain_7d_mm,
        f.rain_1d_mm / hours if hours > 0 else 0.0,
        f.api_index,
        valid_for.month,
        1 if valid_for.month in MONSOON_MONTHS else 0,
        f.lat,
        f.lon,
        f.rain_7d_mm / (DAILY_SEASONAL_NORMAL_MM * 7) * 100,
        0.0,  # humidity: never ingested for training (always 0 there), so pass the same here
        t_max,
        t_min,
        t_mean,
    ]


def _level(cls: int, score: float) -> RiskLevel:
    if cls == 2:
        return "severe" if score >= SEVERE_SCORE else "high"
    return "moderate" if cls == 1 else "low"


def _factors(impacts: np.ndarray) -> list[Factor]:
    merged: dict[str, float] = {}
    for col, value in zip(FEATURE_COLUMNS, impacts):
        name = FACTOR_NAMES.get(col, col)
        merged[name] = merged.get(name, 0.0) + float(value)
    # Only factors that push risk up; the dashboard draws them as bars relative to the largest.
    ranked = sorted((kv for kv in merged.items() if kv[1] > 0), key=lambda kv: kv[1], reverse=True)
    return [Factor(feature=k, impact=round(v, 4)) for k, v in ranked[:3]]


def predict_many(rows: list[tuple[FloodFeatures, date]]) -> list[tuple[float, RiskLevel, list[Factor]]]:
    if _model is None:
        load()
    X = np.array([_row(f, d) for f, d in rows], dtype=float)
    proba = _model.predict_proba(X)
    classes = proba.argmax(axis=1)

    idx = {name: FEATURE_COLUMNS.index(name) for name in HIGH_RISK_THRESHOLDS}
    rule_hits = sum((X[:, idx[name]] >= t).astype(int) for name, t in HIGH_RISK_THRESHOLDS.items())
    classes = np.where((rule_hits >= 2) | (proba[:, 2] > HIGH_PROBABILITY_OVERRIDE), 2, classes)

    # Same weighting as the teammate's service: medium counts half, high fully.
    scores = np.clip(0.5 * proba[:, 1] + proba[:, 2], 0.0, 1.0)

    # SHAP values per class (log-odds); weight them like the score so "higher = more risk".
    booster = _model.get_booster()
    contribs = booster.predict(xgb.DMatrix(X, feature_names=booster.feature_names), pred_contribs=True)
    impacts = 0.5 * contribs[:, 1, :-1] + contribs[:, 2, :-1]

    return [
        (round(float(s), 4), _level(int(c), float(s)), _factors(imp))
        for s, c, imp in zip(scores, classes, impacts)
    ]
