"""Request/response models. Mirror of packages/shared/src/ml.ts — keep the two in sync."""
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

Hazard = Literal["flood"]
RiskLevel = Literal["low", "moderate", "high", "severe"]


class FloodFeatures(BaseModel):
    rain_1d_mm: float = Field(ge=0)
    rain_3d_mm: float = Field(ge=0)
    rain_7d_mm: float = Field(ge=0)
    river_discharge_m3s: float = Field(ge=0)
    discharge_ratio: float = Field(ge=0)
    # Extra inputs for the trained XGBoost model (xgb_model.py); optional so the mock still works.
    rain_hours_1d: float | None = Field(default=None, ge=0)
    api_index: float | None = Field(default=None, ge=0)
    temp_max_c: float | None = None
    temp_min_c: float | None = None
    temp_mean_c: float | None = None
    lat: float | None = None
    lon: float | None = None


class PredictRow(BaseModel):
    region_id: str
    valid_for: date
    features: FloodFeatures


class PredictRequest(BaseModel):
    hazard: Hazard
    rows: list[PredictRow] = Field(min_length=1)


class Factor(BaseModel):
    feature: str
    impact: float


class Prediction(BaseModel):
    region_id: str
    valid_for: date
    risk_score: float = Field(ge=0, le=1)
    risk_level: RiskLevel
    top_factors: list[Factor]


class PredictResponse(BaseModel):
    model_version: str
    predictions: list[Prediction]
