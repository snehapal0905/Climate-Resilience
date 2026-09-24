import { z } from "zod";

/**
 * Every hazard the platform knows about. The UI can list, route to and describe all of them;
 * this says nothing about whether predictions exist.
 */
export const HAZARD_IDS = ["flood", "heatwave", "cyclone", "drought", "landslide", "wildfire", "lightning", "earthquake", "tsunami"] as const;
export const HazardSchema = z.enum(HAZARD_IDS);
export type Hazard = z.infer<typeof HazardSchema>;

/**
 * Hazards with a prediction model behind them. Only these are accepted by the ML contract,
 * stored on prediction runs and produced by the pipeline.
 *
 * Adding a hazard model later means: a hazard-specific pipeline (weather/exposure data → feature
 * rows), a model in the ML service that returns the common Prediction shape, and the hazard ID
 * added here. The API responses and the frontend visualisation stay the same.
 */
export const MODELLED_HAZARDS = ["flood"] as const satisfies readonly Hazard[];
export const ModelledHazardSchema = z.enum(MODELLED_HAZARDS);
export type ModelledHazard = z.infer<typeof ModelledHazardSchema>;

export function isModelledHazard(hazard: Hazard): hazard is ModelledHazard {
  return (MODELLED_HAZARDS as readonly Hazard[]).includes(hazard);
}

export const RISK_LEVELS = ["low", "moderate", "high", "severe"] as const;
export const RiskLevelSchema = z.enum(RISK_LEVELS);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const RISK_LEVEL_META: Record<RiskLevel, { label: string; color: string; rank: number }> = {
  low: { label: "Low", color: "#0ca30c", rank: 0 },
  moderate: { label: "Moderate", color: "#fab219", rank: 1 },
  high: { label: "High", color: "#ec835a", rank: 2 },
  severe: { label: "Severe", color: "#d03b3b", rank: 3 },
};

/**
 * Colour for "no prediction available". Deliberately a neutral grey: no data must never be
 * mistaken for low risk (green).
 */
export const NO_DATA_COLOR = "#9a9a94";

/** Human-readable names for model features, used when explaining a prediction. */
export const FEATURE_LABELS: Record<string, string> = {
  rain_1d_mm: "Rainfall on the day",
  rain_3d_mm: "3-day rainfall",
  rain_7d_mm: "7-day rainfall",
  river_discharge_m3s: "River discharge",
  discharge_ratio: "River discharge vs 30-day normal",
};

export const RUN_MODES = ["live", "replay"] as const;
export const RunModeSchema = z.enum(RUN_MODES);
export type RunMode = z.infer<typeof RunModeSchema>;
