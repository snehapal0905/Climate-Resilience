from fastapi import FastAPI, HTTPException

from . import model, xgb_model
from .schemas import Prediction, PredictRequest, PredictResponse

# Use the trained XGBoost model when its artifact is present; otherwise the rule-based mock.
USE_XGB = xgb_model.available()
if USE_XGB:
    xgb_model.load()
MODEL_VERSION = xgb_model.MODEL_VERSION if USE_XGB else model.MODEL_VERSION

app = FastAPI(
    title="Climate Resilience ML Service",
    description="Flood risk predictions behind the /predict contract: the trained XGBoost model "
    "when artifacts/flood_risk_model.joblib exists, otherwise a rule-based mock.",
    version=MODEL_VERSION,
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model_version": MODEL_VERSION}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    if USE_XGB:
        try:
            results = xgb_model.predict_many([(row.features, row.valid_for) for row in req.rows])
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e)) from e
    else:
        results = [model.predict(row.features) for row in req.rows]

    predictions = [
        Prediction(
            region_id=row.region_id,
            valid_for=row.valid_for,
            risk_score=score,
            risk_level=level,
            top_factors=factors,
        )
        for row, (score, level, factors) in zip(req.rows, results)
    ]
    return PredictResponse(model_version=MODEL_VERSION, predictions=predictions)
