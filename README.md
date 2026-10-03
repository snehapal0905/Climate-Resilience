# 🌊 AI-Driven Climate Resilience & Action Platform — Assam Flood Watch

> District-level flood early warning for Assam, India. Pulls live weather and river data, asks an XGBoost ML model for a 7-day flood-risk forecast per district, and shows it on a bilingual interactive map. Explains *why* the risk is high and tells people what to do.

**SDGs:** 13 Climate Action · 11 Sustainable Cities & Communities · 3 Good Health & Well-being

---

## Table of Contents

1. [What This Platform Does](#what-this-platform-does)
2. [Architecture Overview](#architecture-overview)
3. [Monorepo Structure](#monorepo-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [All Pages & Features](#all-pages--features)
7. [REST API Reference](#rest-api-reference)
8. [Database Schema](#database-schema)
9. [Prediction Pipeline (How It Works)](#prediction-pipeline-how-it-works)
10. [ML Service & Model](#ml-service--model)
11. [Feature Engineering](#feature-engineering)
12. [Shared Types (ML Contract)](#shared-types-ml-contract)
13. [Hazard Registry](#hazard-registry)
14. [Scripts Reference](#scripts-reference)
15. [Data Sources & Attribution](#data-sources--attribution)
16. [Roadmap](#roadmap)

---

## What This Platform Does

Assam is India's most flood-prone state — the Brahmaputra river floods almost every monsoon (June–September), displacing millions. Existing warning systems are reactive, state-wide, English-only, and provide no explanation.

This platform solves that by:

- **Fetching live weather + river discharge** from Open-Meteo (including GloFAS satellite data) every 3 hours
- **Running an XGBoost ML model** to produce a **7-day flood risk score (0–1)** and risk level (Low / Moderate / High / Severe) for every one of Assam's **33 districts**
- **Displaying results** on a colour-coded interactive map with a day-by-day timeline
- **Explaining predictions** in plain language using SHAP values (top 3 contributing weather factors)
- **Telling people what to do** — safety steps, evacuation info, emergency contacts
- **"Am I Safe?" check** — drop a pin anywhere on the map and instantly see your district's risk
- **AI Model Tester** — test the flood model for any city in India on any day from 1985 to 2 weeks ahead, with "what-if" rainfall sliders
- **Historical replay** — re-run the pipeline on past flood events (e.g. June 2022 Assam floods) for demos and model validation
- **Bilingual UI** — English, Assamese, Hindi via i18next

> ⚠️ Prototype. Current predictions come from a rule-based placeholder model (or the XGBoost model if `artifacts/flood_risk_model.joblib` is present) and must not be used for real emergency decisions.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      React Web App (Vite)                        │
│  Landing · Explore Map · District Panel · Am I Safe? · Hazards   │
│  Prepare · Emergency · News · AI Model Tester                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │ REST (JSON)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Node.js API  (Express + TypeScript)             │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  PostgreSQL      │  │  Redis + BullMQ │  │  Open-Meteo     │  │
│  │  + PostGIS       │  │  Job Scheduler  │  │  (weather +     │  │
│  │  (districts,     │  │  (pipeline      │  │   GloFAS river) │  │
│  │   runs, preds,   │  │   every 3 h)    │  │                 │  │
│  │   weather snaps) │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP POST /predict
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              Python ML Service  (FastAPI + XGBoost)              │
│  POST /predict → risk score, risk level, top SHAP factors        │
│  GET  /health  → model version status                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
climate-resilience/
├── apps/
│   ├── web/                        # React + Vite + Tailwind frontend
│   │   └── src/
│   │       ├── App.tsx             # Assam Flood Watch dashboard (map view)
│   │       ├── site/
│   │       │   ├── AppRoutes.tsx   # Client-side routing (all pages)
│   │       │   └── SiteLayout.tsx  # Nav, footer, light theme
│   │       ├── landing/            # Landing / home page
│   │       ├── explore/            # Interactive risk map + district panel
│   │       ├── safety/             # "Am I Safe?" page
│   │       ├── hazards/
│   │       │   └── registry.ts     # Single source of truth: 9 hazards, metadata, status
│   │       ├── prepare/            # Preparedness guides per hazard
│   │       ├── emergency/          # Emergency contacts, evacuation
│   │       ├── news/               # Climate news feed + articles
│   │       ├── model-tester/
│   │       │   └── ModelTesterPage.tsx   # AI playground: any place/day/sliders
│   │       ├── lib/
│   │       │   └── api.ts          # Typed fetch hooks (TanStack Query)
│   │       ├── locales/            # i18n: en / as (Assamese) / hi (Hindi)
│   │       └── i18n.ts             # i18next configuration
│   │
│   └── api/                        # Express API (Node.js + TypeScript)
│       └── src/
│           ├── app.ts              # Express app: CORS, helmet, routes
│           ├── server.ts           # HTTP server start
│           ├── env.ts              # Validated environment variables (Zod)
│           ├── logger.ts           # Pino structured logger
│           ├── db/
│           │   ├── client.ts       # Drizzle ORM + postgres.js connection
│           │   ├── schema.ts       # 4 tables: regions, prediction_runs, run_weather, risk_predictions
│           │   ├── migrate.ts      # Runs Drizzle migrations
│           │   └── seed.ts         # Seeds 33 Assam districts from GeoJSON
│           ├── pipeline/
│           │   ├── run.ts          # Main orchestrator: regions → weather → features → ML → DB
│           │   ├── openMeteo.ts    # Open-Meteo client (forecast + archive + GloFAS)
│           │   ├── features.ts     # Feature engineering (API index, discharge ratio, rain sums)
│           │   ├── mlClient.ts     # HTTP client for POST /predict
│           │   └── cli.ts          # CLI entry point for npm run pipeline
│           ├── jobs/               # BullMQ worker + cron scheduler
│           ├── routes/
│           │   ├── runs.ts         # GET/POST /api/runs
│           │   ├── risk.ts         # GET /api/risk/map and /api/risk/summary
│           │   ├── regions.ts      # GET /api/regions/:id and /api/regions/locate
│           │   └── playground.ts   # POST /api/model-tester (on-demand ML)
│           └── lib/
│               ├── dates.ts        # Date helpers (IST-aware)
│               ├── http.ts         # HttpError class + errorHandler middleware
│               └── redact.ts       # Pino serializer (never logs precise lat/lon)
│
├── packages/
│   └── shared/src/
│       ├── ml.ts                   # ML contract: FloodFeatures, PredictRequest/Response, FEATURE_LABELS
│       ├── risk.ts                 # HAZARD_IDS, MODELLED_HAZARDS, RISK_LEVEL_META
│       ├── api.ts                  # API response types: RunSummary, RegionDetail, RiskSummary, etc.
│       └── index.ts                # Re-exports everything
│
├── services/
│   └── ml/                         # Python FastAPI ML microservice
│       ├── app/
│       │   ├── main.py             # FastAPI app + /health + /predict endpoints
│       │   ├── schemas.py          # Pydantic models (mirrors packages/shared/src/ml.ts)
│       │   ├── model.py            # Rule-based mock model (fallback, no joblib needed)
│       │   └── xgb_model.py        # XGBoost adapter: load artifact, SHAP, predict_many
│       ├── artifacts/              # Place flood_risk_model.joblib here
│       └── requirements.txt
│
├── data/
│   └── assam-districts.geojson     # 33 Assam districts (Census 2011 boundaries)
│
├── docker-compose.yml              # PostgreSQL/PostGIS + Redis + ML service
├── package.json                    # Root workspace scripts
├── tsconfig.base.json              # Shared TS compiler options
└── .env.example                    # Copy to apps/api/.env
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| Docker Desktop | Latest |
| Python | 3.11+ (optional, for local ML dev) |

### Quick Start

```bash
# 1. Install all workspace dependencies
npm install

# 2. Copy environment file
cp .env.example apps/api/.env

# 3. Start infrastructure (PostgreSQL/PostGIS, Redis, ML service)
npm run infra:up

# 4. Create database tables
npm run db:migrate

# 5. Seed 33 Assam districts into the database
npm run db:seed

# 6. Run the June 2022 flood replay (loads demo predictions)
npm run pipeline:replay

# 7. (Optional) Run today's live forecast
npm run pipeline:live

# 8. Start the API server  →  http://localhost:4000
npm run dev:api

# 9. Start the web app    →  http://localhost:5173
npm run dev:web
```

---

## Environment Variables

Copy `.env.example` to `apps/api/.env`:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgres://climate:climate@localhost:5432/climate` | PostgreSQL connection string (PostGIS required) |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection for BullMQ job queue |
| `ML_SERVICE_URL` | `http://localhost:8000` | Python FastAPI ML microservice base URL |
| `PORT` | `4000` | Express API port |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed origins |
| `PIPELINE_CRON` | `0 */3 * * *` | Cron expression for live forecast runs (every 3 h). Leave empty to disable. |

Frontend env (`apps/web/.env`):

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL (leave empty to proxy to same origin in dev) |

---

## All Pages & Features

### `/` — Landing Page
Marketing home page. Introduces the platform, links to the flood dashboard, explore map, preparedness guides and the AI model tester.

### `/assam-flood-watch` — Assam Flood Watch Dashboard ⭐
The core flood dashboard:
- **Interactive MapLibre GL map** — all 33 Assam districts colour-coded by risk level (grey → yellow → orange → red)
- **Day picker** — step through the 7-day forecast
- **Run selector** — switch between live and historical replay runs
- **District click panel** — Recharts 7-day bar chart, top SHAP factors, weather snapshot, safety action list
- **"Am I safe?" pin drop** — click any point to get the district's current risk

### `/explore` — Explore India
National-level risk explore page. Uses the same map component. Hazard selector for future multi-hazard views.

### `/am-i-safe` — Am I Safe?
Simple form or GPS-based location check. Calls `GET /api/regions/locate?lat=&lon=` and shows the district's risk level with safety guidance.

### `/hazards` — Climate Hazards
Registry of all 9 tracked hazards: Flood (active), Heatwave, Cyclone, Drought, Landslide, Wildfire, Lightning, Earthquake, Tsunami (all coming soon). Each hazard card shows name, description, data availability, and links to its preparedness guide.

### `/prepare` — Preparedness Hub
Overview page linking to per-hazard preparedness guides. Static + SEO-friendly.

### `/prepare/:hazard` — Hazard Guide
Dedicated preparedness guide for any hazard in the registry. URL-driven: `/prepare/flood`, `/prepare/cyclone`, etc.

### `/emergency` — Emergency Center
Emergency contacts (NDMA, ASDMA, state helplines), evacuation steps, shelter information.

### `/news` — News & Insights
Climate news feed. Articles on Assam floods, climate policy, disaster management.

### `/news/:id` — News Article
Individual article page, driven by the news feed data.

### `/ai-model` — AI Model Tester ⭐
Interactive playground to test the XGBoost flood model:
- Select a city (Mumbai, Chennai, Kolkata, Guwahati, Delhi, Bengaluru, Hyderabad, Kochi, Silchar, Dibrugarh, Patna) or enter custom lat/lon
- Pick any date from **1985 to 14 days ahead** (archive or forecast weather fetched on demand)
- One-click **known flood day examples**: Mumbai 2005, Chennai 2015, Kerala 2018, Patna 2019, Assam 2022, dry Delhi winter day
- **What-if sliders** — adjust rain_1d, rain_3d, rain_7d, api_index and watch the prediction update in real time
- Shows: risk score %, risk level badge, SHAP factor bars ("Why this prediction?"), full input table ("What the model saw")

### `/about` — About
Platform information page.

---

## REST API Reference

Base URL (local): `http://localhost:4000`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Returns `{ status, database, ml_service }`. 200 = healthy, 503 = degraded |
| `GET` | `/api/runs` | None | Latest live run + one entry per replay date. Returns `RunSummary[]` |
| `POST` | `/api/runs` | `x-admin-token` header | Queue a new run. Body: `{ mode: "live"\|"replay", date?, label? }` |
| `GET` | `/api/risk/map` | None | GeoJSON FeatureCollection of all districts with risk. Query: `?run=&date=` |
| `GET` | `/api/risk/summary` | None | Risk level counts + top 5 districts. Query: `?run=&date=` |
| `GET` | `/api/regions/:id` | None | District detail: 7-day risk timeline, top factors, weather, explanation. Query: `?run=` |
| `GET` | `/api/regions/locate` | None | Point-in-polygon lookup. Query: `?lat=&lon=`. Returns `{ id, name }` |
| `POST` | `/api/model-tester` | None | On-demand prediction for any lat/lon/date. Body: `{ lat, lon, date, overrides? }` |

**Omitting `run`** defaults to the newest live run. **Omitting `date`** defaults to the run's reference date.

### Model Tester Request/Response

```ts
// POST /api/model-tester
{
  lat: number,           // 6–37.5 (India bounding box)
  lon: number,           // 68–97.5
  date: string,          // ISO date, 1985-01-01 to today+14d
  overrides?: {          // Optional "what-if" overrides
    rain_1d_mm?: number,
    rain_3d_mm?: number,
    rain_7d_mm?: number,
    api_index?: number
  }
}

// Response: ModelTesterResponse
{
  model_version: string,
  date: string,
  source: "forecast" | "observed",
  observed: FloodFeatures,   // Real weather fetched for this date
  features: FloodFeatures,   // Actual inputs sent to model (observed + overrides)
  prediction: {
    valid_for: string,
    risk_score: number,      // 0.0 – 1.0
    risk_level: "low" | "moderate" | "high" | "severe",
    top_factors: Factor[]    // Up to 3 SHAP factors
  }
}
```

---

## Database Schema

Four tables (Drizzle ORM + PostgreSQL + PostGIS):

### `regions`
Stores all 33 Assam district polygons and a reference centroid for weather sampling.

| Column | Type | Description |
|---|---|---|
| `id` | `text` PK | e.g. `"assam-kamrup"` |
| `name` | `text` | District name |
| `state` | `text` | State name |
| `census_code` | `text` | 2011 Census district code |
| `population` | `integer` | Population (nullable, WorldPop planned) |
| `geom` | `geometry(MultiPolygon, 4326)` | PostGIS boundary (GiST index) |
| `ref_lat` | `double precision` | ST_PointOnSurface lat — weather is sampled here |
| `ref_lon` | `double precision` | ST_PointOnSurface lon |

### `prediction_runs`
One row per pipeline execution.

| Column | Type | Description |
|---|---|---|
| `id` | `serial` PK | Run ID |
| `mode` | `text` | `"live"` or `"replay"` |
| `hazard` | `text` | Currently always `"flood"` |
| `reference_date` | `date` | The anchor date for this run |
| `label` | `text` | Human-readable label |
| `status` | `text` | `"running"` / `"completed"` / `"failed"` |
| `model_version` | `text` | From ML service response |
| `error` | `text` | Error message if failed |
| `created_at` | `timestamptz` | |
| `completed_at` | `timestamptz` | |

### `run_weather`
Weather snapshot for every (run, district, date) triple — makes every prediction traceable.

| Column | Type | Description |
|---|---|---|
| `run_id` | `integer` FK → `prediction_runs` | |
| `region_id` | `text` FK → `regions` | |
| `date` | `date` | |
| `precipitation_mm` | `real` | Daily rainfall |
| `temperature_max_c` | `real` | Max temperature |
| `river_discharge_m3s` | `real` | GloFAS river flow |
| `is_forecast` | `boolean` | `true` if future date |

### `risk_predictions`
One row per (run, district, day). Stores model output + the exact features sent.

| Column | Type | Description |
|---|---|---|
| `run_id` + `region_id` + `valid_for` | PK | Composite |
| `risk_score` | `real` | 0.0 – 1.0 |
| `risk_level` | `text` | `low` / `moderate` / `high` / `severe` |
| `top_factors` | `jsonb` | `Factor[]` — SHAP contributions |
| `features` | `jsonb` | `FloodFeatures` — exact ML inputs |

---

## Prediction Pipeline (How It Works)

The pipeline runs automatically every 3 hours (configured via `PIPELINE_CRON`). It can also be triggered manually or run in replay mode.

```
Step 1: Load all 33 region centroids from PostgreSQL

Step 2: Determine date window
  • baseline: referenceDate − 30 days  (for discharge baseline & API index warmup)
  • horizon:  referenceDate + 6 days   (7-day forecast)

Step 3: Fetch weather from Open-Meteo (chunked, 25 districts per request)
  • Live mode   → forecast API (recent past + 7-day forecast)
  • Replay mode → archive API (ERA5 reanalysis, back to 1984)
  • Both modes  → GloFAS flood API (river discharge)

Step 4: Feature engineering per (district, day)
  • rain_1d_mm    → precipitation_sum for that day
  • rain_3d_mm    → 3-day rolling sum
  • rain_7d_mm    → 7-day rolling sum
  • api_index     → Antecedent Precipitation Index: P_t + 0.9 × API_(t-1)
  • discharge_ratio → today's discharge ÷ 30-day mean discharge
  • rain_hours_1d → precipitation_hours (rainfall intensity input)
  • temp_max/min/mean, lat, lon

Step 5: POST /predict to Python ML service
  • Sends 231 rows (33 districts × 7 days)
  • Receives risk_score, risk_level, top_factors per row

Step 6: Store in PostgreSQL (transaction)
  • run_weather: weather snapshots for all districts and all days
  • risk_predictions: model outputs
  • Update prediction_runs status → "completed"
```

### Live vs Replay Modes

| Mode | Date Source | Weather API | Use Case |
|---|---|---|---|
| `live` | Today (IST) | forecast API | Production — runs every 3 hours |
| `replay` | Any past date | archive API (ERA5) | Demo, model validation, incident review |

---

## ML Service & Model

### Service Endpoints

```
GET  /health    → { "status": "ok", "model_version": "xgb-1.0.0" }
POST /predict   → PredictResponse (risk scores + SHAP factors)
```

Interactive docs when running locally: `http://localhost:8000/docs`

### Two Model Implementations

**1. Rule-based mock** (`app/model.py`) — used when `artifacts/flood_risk_model.joblib` is absent.

```
Weights:
  rain_1d_mm       → 0.30  (normalised by IMD "extremely heavy" 204.4 mm)
  rain_3d_mm       → 0.20  (normalised by 350 mm)
  rain_7d_mm       → 0.15  (normalised by 600 mm)
  discharge_ratio  → 0.35  ((ratio − 1) / 2, clamped 0–1)

risk_score = Σ(weight × normalised_value)   clipped to [0.0, 1.0]
```

**2. XGBoost trained model** (`app/xgb_model.py`) — loads `artifacts/flood_risk_model.joblib` when present.

```
Model:   XGBoost multi-class classifier  (3 classes: low / medium / high)
Output:  predict_proba(X) → [P(low), P(medium), P(high)]

Risk Score:
  score = clip(0.5 × P(medium) + P(high), 0.0, 1.0)

Risk Level:
  score < 0.25  → "low"
  score < 0.45  → "moderate"
  score < 0.65  → "high"     (or "severe" if score ≥ 0.80)
  score ≥ 0.65  → "severe"

Rule Override (applied on top of model):
  If ≥ 2 of these are true → force class = High
    rainfall_24h ≥ 30 mm
    rainfall_3d  ≥ 107 mm
    rainfall_7d  ≥ 206 mm
    api_index    ≥ 239

SHAP (per-prediction explanation):
  Uses XGBoost booster.predict(pred_contribs=True)
  impacts = 0.5 × contribs[class=medium] + contribs[class=high]
  Returns top 3 positive contributors as top_factors
```

### Plugging in the Real Model

1. Place your trained `flood_risk_model.joblib` in `services/ml/artifacts/`
2. Optionally add `model_metadata.json` with `{ "model_version": "your-version-string" }`
3. Restart the ML service (`docker compose restart ml`)
4. Nothing else changes — the API and frontend use the same contract

> The `xgb_model.py` adapter was written to match the feature engineering in `github.com/Joel-Nadar/ml-model-pbl-project` (`python-ml/train_model.py`) including the same API decay constant (k=0.9), monsoon months (6–9), and seasonal rainfall baseline (1700 mm / 120 days for Guwahati).

---

## Feature Engineering

All features are computed in `apps/api/src/pipeline/features.ts` and mirrored in `services/ml/app/xgb_model.py`.

| Feature | Formula | Unit |
|---|---|---|
| `rain_1d_mm` | `precipitation_sum[day]` | mm |
| `rain_3d_mm` | `Σ precipitation_sum[day-2 … day]` | mm |
| `rain_7d_mm` | `Σ precipitation_sum[day-6 … day]` | mm |
| `rainfall_intensity` | `rain_1d_mm / precipitation_hours` | mm/h |
| `api_index` | `P_t + 0.9 × API_(t-1)` (30-day warm-up) | — |
| `discharge_ratio` | `river_discharge[day] / mean(river_discharge[-30d…-1d])` | ratio |
| `river_discharge_m3s` | Raw GloFAS discharge | m³/s |
| `month` | Calendar month | 1–12 |
| `is_monsoon_season` | `month ∈ {6, 7, 8, 9}` | 0/1 |
| `rainfall_pct_of_seasonal_normal` | `rain_7d / (1700/120 × 7) × 100` | % |
| `temp_max_c` | `temperature_2m_max` | °C |
| `temp_min_c` | `temperature_2m_min` | °C |
| `temp_mean_c` | `temperature_2m_mean` | °C |
| `lat`, `lon` | District centroid (ST_PointOnSurface) | degrees |

Constants:
- `BASELINE_DAYS = 30` (days of history for discharge baseline & API warmup)
- `HORIZON_DAYS = 7` (forecast window)
- `API_DECAY = 0.9` (Antecedent Precipitation Index decay)

---

## Shared Types (ML Contract)

`packages/shared/src/ml.ts` is the single contract between the API and the ML service. The Python `schemas.py` mirrors it exactly.

```ts
// The 14 features the XGBoost model was trained on
interface FloodFeatures {
  rain_1d_mm: number          // ≥ 0
  rain_3d_mm: number          // ≥ 0
  rain_7d_mm: number          // ≥ 0
  river_discharge_m3s: number // ≥ 0
  discharge_ratio: number     // ≥ 0
  rain_hours_1d?: number      // ≥ 0  (XGBoost rainfall intensity)
  api_index?: number          // ≥ 0  (XGBoost Antecedent Precipitation Index)
  temp_max_c?: number
  temp_min_c?: number
  temp_mean_c?: number
  lat?: number
  lon?: number
}

type RiskLevel = "low" | "moderate" | "high" | "severe"

interface Factor { feature: string; impact: number }

// POST /predict request
interface PredictRequest {
  hazard: "flood"
  rows: Array<{ region_id: string; valid_for: string; features: FloodFeatures }>
}

// POST /predict response
interface PredictResponse {
  model_version: string
  predictions: Array<{
    region_id: string
    valid_for: string
    risk_score: number      // 0.0 – 1.0
    risk_level: RiskLevel
    top_factors: Factor[]   // Up to 3, SHAP-derived
  }>
}
```

**Adding features to the model**: add them to both `packages/shared/src/ml.ts` and `services/ml/app/schemas.py`, then update `apps/api/src/pipeline/features.ts` to compute them.

---

## Hazard Registry

Nine hazards are tracked (`packages/shared/src/risk.ts`):

| Hazard | Status | Dashboard |
|---|---|---|
| `flood` | ✅ **Active** — model running | `/assam-flood-watch` |
| `heatwave` | 🔜 Coming soon | — |
| `cyclone` | 🔜 Coming soon | — |
| `drought` | 🔜 Coming soon | — |
| `landslide` | 🔜 Coming soon | — |
| `wildfire` | 🔜 Coming soon | — |
| `lightning` | 🔜 Coming soon | — |
| `earthquake` | 🔜 Coming soon | — |
| `tsunami` | 🔜 Coming soon | — |

**Adding a new hazard model**: build a data → feature pipeline, add the model to the ML service (returning the same `Prediction` shape), then add the hazard ID to `MODELLED_HAZARDS` in `packages/shared/src/risk.ts`. The API, map, and district panel all adapt automatically.

---

## Scripts Reference

Run from the repo root:

| Script | What it does |
|---|---|
| `npm run infra:up` | Start PostgreSQL/PostGIS, Redis, and the ML Docker container |
| `npm run infra:down` | Stop all Docker services |
| `npm run db:migrate` | Apply Drizzle ORM migrations to create/update tables |
| `npm run db:seed` | Load 33 Assam districts from `data/assam-districts.geojson` |
| `npm run pipeline:live` | Run the live forecast pipeline (today's date, Open-Meteo forecast API) |
| `npm run pipeline:replay` | Run a replay for 2022-06-14 (June 2022 Assam flood event) |
| `npm run dev:api` | Start API dev server with hot reload → `http://localhost:4000` |
| `npm run dev:web` | Start Vite dev server → `http://localhost:5173` |
| `npm run typecheck` | TypeScript type-check all workspaces |
| `npm test` | Run all tests (Vitest) |
| `npm run build` | Production build of all workspaces |
| `npm run db:generate -w @climate/api` | Re-generate Drizzle migration after changing `schema.ts` |

ML service (run separately from `services/ml/`):

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## Data Sources & Attribution

| Source | Data | Licence |
|---|---|---|
| [Open-Meteo](https://open-meteo.com) | Weather forecast + ERA5 historical archive | CC BY 4.0 |
| [GloFAS via Open-Meteo](https://open-meteo.com/en/docs/flood-api) | River discharge (reanalysis 1984+ and forecast) | Copernicus CEMS |
| [india-maps-data](https://github.com/udit-001/india-maps-data) | Assam district boundaries (Census 2011) | Open Government Data |
| [OpenFreeMap](https://openfreemap.org) | Map basemap tiles | © OpenMapTiles, © OpenStreetMap contributors |
| [WorldPop](https://www.worldpop.org) | District population estimates *(planned Phase 3)* | CC BY 4.0 |

---

## Roadmap

- [x] **Phase 1**: Monorepo, Docker, PostGIS schema, 33 Assam district boundaries
- [x] **Phase 2**: Open-Meteo weather ingestion, mock ML service, risk API, BullMQ scheduled pipeline
- [x] **Phase 3 (core)**: Risk map, day picker, district panel, "Am I Safe?", AI Model Tester, English/Hindi, dark mode
- [ ] **Phase 3 (rest)**: Assamese language, PWA/offline mode, district population (WorldPop) for "people at risk"
- [ ] **Phase 4**: Authentication (citizen / authority / admin), alert subscriptions, alert engine, email/web-push/Telegram, Socket.IO live updates
- [ ] **Phase 5**: Authority alert approval dashboard, citizen flood reports, shelter and resource map
- [ ] **Phase 6**: Integrate fully-trained XGBoost model, OpenAPI docs, Playwright e2e tests, production deployment (Vercel + Render + Neon + Upstash)
- [ ] **Phase 7+**: Multi-hazard models (heatwave, cyclone, landslide…), multi-state coverage beyond Assam

---

*Built for SDGs 13 · 11 · 3 — Climate Action, Sustainable Cities, Good Health & Well-being*
