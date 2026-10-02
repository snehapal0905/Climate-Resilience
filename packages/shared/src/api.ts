/** Response shapes of the public REST API, shared by the backend and the web app. */
import type { Geometry } from "geojson";
import type { Factor, FloodFeatures } from "./ml.js";
import type { ModelledHazard, RiskLevel, RunMode } from "./risk.js";

export interface RunSummary {
  id: number;
  mode: RunMode;
  hazard: ModelledHazard;
  /** The "today" of the run: live runs use the actual date, replays a historical one */
  reference_date: string;
  model_version: string;
  label: string;
  created_at: string;
  /** Forecast days available in this run, ascending */
  valid_dates: string[];
}

export interface RegionRiskProperties {
  id: string;
  name: string;
  /** State the region belongs to, as named in the boundary data (e.g. "Assam") */
  state: string;
  population: number | null;
  risk_score: number | null;
  risk_level: RiskLevel | null;
}

export interface RegionRiskCollection {
  type: "FeatureCollection";
  run: RunSummary | null;
  valid_for: string | null;
  features: Array<{
    type: "Feature";
    id: string;
    geometry: Geometry;
    properties: RegionRiskProperties;
  }>;
}

export interface DailyWeather {
  date: string;
  precipitation_mm: number | null;
  river_discharge_m3s: number | null;
  temperature_max_c: number | null;
  /** true when this day was after the run's reference date (i.e. forecast, not observed) */
  is_forecast: boolean;
}

export interface RiskPoint {
  valid_for: string;
  risk_score: number;
  risk_level: RiskLevel;
  top_factors: Factor[];
}

export interface RegionDetail {
  id: string;
  name: string;
  population: number | null;
  centroid: { lat: number; lon: number };
  run: RunSummary | null;
  risk_timeline: RiskPoint[];
  weather: DailyWeather[];
}

/** Response of POST /api/model-tester: one on-demand prediction for any point and day. */
export interface ModelTesterResponse {
  model_version: string;
  date: string;
  /** Whether the weather for `date` is observed or a forecast */
  source: "observed" | "forecast";
  /** Features computed from the real weather */
  observed: FloodFeatures;
  /** Features actually sent to the model (observed, with any "what if" overrides applied) */
  features: FloodFeatures;
  prediction: RiskPoint;
}

export interface RiskSummary {
  run: RunSummary | null;
  valid_for: string | null;
  counts: Record<RiskLevel, number>;
  top_regions: Array<{ id: string; name: string; risk_score: number; risk_level: RiskLevel }>;
}
