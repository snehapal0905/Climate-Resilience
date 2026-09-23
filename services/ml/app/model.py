"""
Rule-based stand-in for the real flood model.

Rainfall is normalised against IMD 24-hour categories (heavy 64.5-115.5 mm,
very heavy 115.6-204.4 mm, extremely heavy > 204.4 mm). River discharge is scored by how far
it rises above its recent 30-day normal. The weighted sum is the risk score, and each term's
weighted value doubles as its "impact" so the UI can explain predictions the same way it will
with SHAP values from the trained model.
"""
from .schemas import FloodFeatures, Factor, RiskLevel

MODEL_VERSION = "flood-rules-mock-0.1"

EXTREMELY_HEAVY_24H_MM = 204.4

WEIGHTS = {
    "rain_1d_mm": 0.30,
    "rain_3d_mm": 0.20,
    "rain_7d_mm": 0.15,
    "discharge_ratio": 0.35,
}


def _clamp(x: float) -> float:
    return max(0.0, min(1.0, x))


def _normalised(f: FloodFeatures) -> dict[str, float]:
    return {
        "rain_1d_mm": _clamp(f.rain_1d_mm / EXTREMELY_HEAVY_24H_MM),
        "rain_3d_mm": _clamp(f.rain_3d_mm / 350.0),
        "rain_7d_mm": _clamp(f.rain_7d_mm / 600.0),
        # 1x normal flow = no risk, 3x normal flow = maximum contribution
        "discharge_ratio": _clamp((f.discharge_ratio - 1.0) / 2.0),
    }


def level_for(score: float) -> RiskLevel:
    if score >= 0.65:
        return "severe"
    if score >= 0.45:
        return "high"
    if score >= 0.25:
        return "moderate"
    return "low"


def predict(f: FloodFeatures) -> tuple[float, RiskLevel, list[Factor]]:
    norm = _normalised(f)
    impacts = {k: WEIGHTS[k] * v for k, v in norm.items()}
    score = round(_clamp(sum(impacts.values())), 4)
    factors = sorted(
        (Factor(feature=k, impact=round(v, 4)) for k, v in impacts.items()),
        key=lambda fac: fac.impact,
        reverse=True,
    )
    return score, level_for(score), factors[:3]
