# AI-Driven Climate Resilience & Action Platform — Assam Flood Watch

District-level flood early warning for Assam. The platform pulls live weather and river data, asks an ML model for a 7-day flood-risk forecast per district, and shows it on a bilingual (English/Hindi) map. For each district it explains *why* the risk is high and tells people what to do.

**SDGs:** 13 Climate Action · 11 Sustainable Cities & Communities · 3 Good Health & Well-being

## Architecture

```
React web app ──REST──►  Node.js API (Express + TypeScript)
                            ├── PostgreSQL + PostGIS   districts, runs, predictions, weather snapshots
                            ├── Redis + BullMQ         scheduled pipeline (every 3 h) and on-demand runs
                            ├── Open-Meteo             weather, historical archive, GloFAS river discharge
                            └──HTTP──► Python ML service  (rule-based mock now → trained model later)
```

| Folder | What it is | Owner |
|---|---|---|
| `apps/web` | React + Vite + Tailwind + MapLibre + Recharts + i18next | Frontend |
| `apps/api` | Express API, Drizzle ORM, prediction pipeline, job queue | Backend |
| `packages/shared` | TypeScript types + Zod schemas shared by web and API, **including the ML contract** | Everyone |
| `services/ml` | FastAPI ML service. Currently a mock that follows the contract | ML |
| `data/` | Assam district boundaries (GeoJSON, 33 districts) | — |

### The ML contract

The API sends `POST /predict` with one feature row per (district, day) and gets back a risk score, a level, and the top contributing factors. The full contract is in [`packages/shared/src/ml.ts`](packages/shared/src/ml.ts), mirrored in [`services/ml/app/schemas.py`](services/ml/app/schemas.py). To plug in the real model, see [`services/ml/README.md`](services/ml/README.md); nothing else needs to change.

### Live vs replay runs

- **Live** runs use today's date and the Open-Meteo forecast. They're scheduled every 3 hours.
- **Replay** runs re-run the pipeline on a historical date using archived observations. `2022-06-14` replays the June 2022 Assam floods, which is useful for demos and for checking the model against events that actually happened.

## Getting started

Prerequisites: Node 20+, Docker Desktop.

```bash
npm install
cp .env.example apps/api/.env

npm run infra:up          # Postgres/PostGIS, Redis, mock ML service (Docker)
npm run db:migrate        # create tables
npm run db:seed           # load the 33 Assam districts
npm run pipeline:replay   # June 2022 flood replay
npm run pipeline:live     # today's forecast

npm run dev:api           # http://localhost:4000
npm run dev:web           # http://localhost:5173
```

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Database and ML service status |
| GET | `/api/runs` | Latest live run + one run per replay date |
| POST | `/api/runs` | Queue a run `{mode, date?, label?}`. Needs the `x-admin-token` header (temporary until auth) |
| GET | `/api/risk/map?run=&date=` | GeoJSON of districts with risk for a run/day |
| GET | `/api/risk/summary?run=&date=` | Counts per risk level + top 5 districts |
| GET | `/api/regions/:id?run=` | District detail: 7-day risk timeline, explanations, weather |
| GET | `/api/regions/locate?lat=&lon=` | Which district contains a point ("Am I safe?") |

Leaving out `run` means the newest live run; leaving out `date` means the run's reference date.

## Scripts

`npm run typecheck` · `npm test` · `npm run build` · `npm run db:generate -w @climate/api` (after changing `schema.ts`)

## Roadmap

- [x] Phase 1: monorepo, Docker, PostGIS schema, district boundaries
- [x] Phase 2: Open-Meteo ingestion, mock ML service, risk API, scheduled pipeline
- [x] Phase 3 (core): risk map, day picker, district panel, "Am I safe?", English/Hindi, dark mode
- [ ] Phase 3 (rest): Assamese, PWA/offline, district population (WorldPop) for "people at risk"
- [ ] Phase 4: auth (citizen / authority / admin), alert subscriptions, alert engine, email/web-push/Telegram, Socket.IO
- [ ] Phase 5: authority dashboard, alert approval queue, citizen reports, shelters and resources
- [ ] Phase 6: integrate the trained model, OpenAPI docs, Playwright tests, deployment (Vercel + Render + Neon/Supabase + Upstash)

## Data sources & attribution

Weather and river discharge: [Open-Meteo](https://open-meteo.com) (CC BY 4.0), including GloFAS river discharge from the Copernicus Emergency Management Service. District boundaries: [india-maps-data](https://github.com/udit-001/india-maps-data) (Census 2011 district codes). Basemap: [OpenFreeMap](https://openfreemap.org), © OpenMapTiles, data © OpenStreetMap contributors.

> Prototype. Current predictions come from a rule-based placeholder model and must not be used for real emergency decisions.
