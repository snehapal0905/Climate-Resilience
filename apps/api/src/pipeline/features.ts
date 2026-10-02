import type { FloodFeatures, PredictRow } from "@climate/shared";
import { addDays, dateRange } from "../lib/dates.js";
import type { Point, WeatherSeries } from "./openMeteo.js";

/** Days before the reference date used as the "normal" river discharge baseline. */
export const BASELINE_DAYS = 30;
/** Number of days (starting at the reference date) to predict. */
export const HORIZON_DAYS = 7;
/** Decay constant of the Antecedent Precipitation Index (same k the XGBoost model was trained with). */
export const API_DECAY = 0.9;

/** The full date window of weather data needed to build features for one run. */
export function requiredWindow(referenceDate: string) {
  return { start: addDays(referenceDate, -BASELINE_DAYS), end: addDays(referenceDate, HORIZON_DAYS - 1) };
}

const round = (x: number, digits = 2) => Math.round(x * 10 ** digits) / 10 ** digits;

function rainSum(series: WeatherSeries, end: string, days: number): number {
  let total = 0;
  for (const d of dateRange(addDays(end, -(days - 1)), end)) total += series.get(d)?.precipitation_mm ?? 0;
  return total;
}

/**
 * Antecedent Precipitation Index on `day`: API_t = P_t + k · API_(t-1), starting from the first day
 * in the series. The series starts BASELINE_DAYS before the reference date, so older rain (weight
 * 0.9^30 ≈ 4%) is dropped.
 */
export function apiIndex(series: WeatherSeries, day: string): number {
  let api = 0;
  for (const d of [...series.keys()].sort()) {
    if (d > day) break;
    api = (series.get(d)?.precipitation_mm ?? 0) + API_DECAY * api;
  }
  return api;
}

export function baselineDischarge(series: WeatherSeries, referenceDate: string): number | null {
  const values = dateRange(addDays(referenceDate, -BASELINE_DAYS), addDays(referenceDate, -1))
    .map((d) => series.get(d)?.river_discharge_m3s)
    .filter((v): v is number => v != null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function floodFeatures(
  series: WeatherSeries,
  day: string,
  baseline: number | null,
  point?: Point,
): FloodFeatures {
  const w = series.get(day);
  const discharge = w?.river_discharge_m3s ?? null;
  // Tiny baselines (dry streams) make the ratio explode, so require a meaningful flow before comparing.
  const ratio = discharge != null && baseline != null && baseline >= 1 ? discharge / baseline : 1;
  return {
    rain_1d_mm: round(series.get(day)?.precipitation_mm ?? 0),
    rain_3d_mm: round(rainSum(series, day, 3)),
    rain_7d_mm: round(rainSum(series, day, 7)),
    river_discharge_m3s: round(discharge ?? 0),
    discharge_ratio: round(ratio, 3),
    rain_hours_1d: round(w?.precipitation_hours ?? 0),
    api_index: round(apiIndex(series, day)),
    ...(w?.temperature_max_c != null && { temp_max_c: w.temperature_max_c }),
    ...(w?.temperature_min_c != null && { temp_min_c: w.temperature_min_c }),
    ...(w?.temperature_mean_c != null && { temp_mean_c: w.temperature_mean_c }),
    ...(point && { lat: point.lat, lon: point.lon }),
  };
}

/** One prediction row per forecast day for a region. */
export function buildFloodRows(
  regionId: string,
  series: WeatherSeries,
  referenceDate: string,
  point?: Point,
): PredictRow[] {
  const baseline = baselineDischarge(series, referenceDate);
  return dateRange(referenceDate, addDays(referenceDate, HORIZON_DAYS - 1)).map((day) => ({
    region_id: regionId,
    valid_for: day,
    features: floodFeatures(series, day, baseline, point),
  }));
}
