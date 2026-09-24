/**
 * Contract between the Node API and the ML service.
 *
 * The ML service is a black box that turns one feature row (region + day) into a risk
 * prediction. Any model — the rule-based mock in services/ml or the real trained model —
 * must accept PredictRequest at POST /predict and return PredictResponse.
 * Keep services/ml/app/schemas.py in sync with this file.
 */
import { z } from "zod";
import { ModelledHazardSchema, RiskLevelSchema } from "./risk.js";

export const FloodFeaturesSchema = z.object({
  /** Precipitation on valid_for day (mm) */
  rain_1d_mm: z.number().nonnegative(),
  /** Precipitation summed over valid_for and the 2 days before (mm) */
  rain_3d_mm: z.number().nonnegative(),
  /** Precipitation summed over valid_for and the 6 days before (mm) */
  rain_7d_mm: z.number().nonnegative(),
  /** Modelled river discharge at the region's reference point on valid_for (m³/s, GloFAS) */
  river_discharge_m3s: z.number().nonnegative(),
  /** river_discharge_m3s divided by the mean discharge of the 30 days before the run date */
  discharge_ratio: z.number().nonnegative(),
});
export type FloodFeatures = z.infer<typeof FloodFeaturesSchema>;

export const PredictRowSchema = z.object({
  region_id: z.string(),
  /** ISO date (YYYY-MM-DD) the prediction is for */
  valid_for: z.iso.date(),
  features: FloodFeaturesSchema,
});
export type PredictRow = z.infer<typeof PredictRowSchema>;

export const PredictRequestSchema = z.object({
  /** Only hazards with a model; the ML service rejects anything else. */
  hazard: ModelledHazardSchema,
  rows: z.array(PredictRowSchema).min(1),
});
export type PredictRequest = z.infer<typeof PredictRequestSchema>;

export const FactorSchema = z.object({
  feature: z.string(),
  /** Contribution of this feature to risk_score (e.g. SHAP value); higher = pushes risk up */
  impact: z.number(),
});
export type Factor = z.infer<typeof FactorSchema>;

export const PredictionSchema = z.object({
  region_id: z.string(),
  valid_for: z.iso.date(),
  /** Probability-like score in [0, 1] */
  risk_score: z.number().min(0).max(1),
  risk_level: RiskLevelSchema,
  top_factors: z.array(FactorSchema),
});
export type Prediction = z.infer<typeof PredictionSchema>;

export const PredictResponseSchema = z.object({
  model_version: z.string(),
  predictions: z.array(PredictionSchema),
});
export type PredictResponse = z.infer<typeof PredictResponseSchema>;
