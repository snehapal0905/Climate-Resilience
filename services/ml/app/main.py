from fastapi import FastAPI

from . import model
from .schemas import Prediction, PredictRequest, PredictResponse

app = FastAPI(
    title="Climate Resilience ML Service (mock)",
    description="Rule-based stand-in that implements the /predict contract until the trained model is ready.",
    version=model.MODEL_VERSION,
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model_version": model.MODEL_VERSION}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    predictions = []
    for row in req.rows:
        score, level, factors = model.predict(row.features)
        predictions.append(
            Prediction(
                region_id=row.region_id,
                valid_for=row.valid_for,
                risk_score=score,
                risk_level=level,
                top_factors=factors,
            )
        )
    return PredictResponse(model_version=model.MODEL_VERSION, predictions=predictions)
