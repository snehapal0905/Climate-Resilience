# ML service

This folder currently holds a **rule-based mock** so the platform can be built and demoed before the trained model exists.

## Replacing the mock with the real model

The only thing the rest of the platform depends on is the HTTP contract:

- `GET /health` → `{"status": "ok", "model_version": "..."}`
- `POST /predict` → request/response defined in `app/schemas.py` (mirrors `packages/shared/src/ml.ts`)

Keep those two endpoints and schemas identical, swap `app/model.py` for code that loads your trained model, and bump `MODEL_VERSION`. Return up to 3 `top_factors` (e.g. SHAP values), since the dashboard uses them to explain each prediction.

If you need extra input features, add them to both `app/schemas.py` and `packages/shared/src/ml.ts`, and tell the backend owner so `apps/api/src/pipeline/features.ts` computes them.

## Running locally

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows  (source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Interactive docs: http://localhost:8000/docs
