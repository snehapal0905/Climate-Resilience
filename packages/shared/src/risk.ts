import { z } from "zod";

export const HAZARDS = ["flood"] as const;
export const HazardSchema = z.enum(HAZARDS);
export type Hazard = z.infer<typeof HazardSchema>;

export const RISK_LEVELS = ["low", "moderate", "high", "severe"] as const;
export const RiskLevelSchema = z.enum(RISK_LEVELS);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const RISK_LEVEL_META: Record<RiskLevel, { label: string; color: string; rank: number }> = {
  low: { label: "Low", color: "#0ca30c", rank: 0 },
  moderate: { label: "Moderate", color: "#fab219", rank: 1 },
  high: { label: "High", color: "#ec835a", rank: 2 },
  severe: { label: "Severe", color: "#d03b3b", rank: 3 },
};

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
