import type { FloodFeatures, PredictRow } from "@climate/shared";
import { addDays, dateRange } from "../lib/dates.js";
import type { WeatherSeries } from "./openMeteo.js";

/** Days before the reference date used as the "normal" river discharge baseline. */
export const BASELINE_DAYS = 30;
/** Number of days (starting at the reference date) to predict. */
export const HORIZON_DAYS = 7;

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

export function baselineDischarge(series: WeatherSeries, referenceDate: string): number | null {
  const values = dateRange(addDays(referenceDate, -BASELINE_DAYS), addDays(referenceDate, -1))
    .map((d) => series.get(d)?.river_discharge_m3s)
    .filter((v): v is number => v != null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function floodFeatures(series: WeatherSeries, day: string, baseline: number | null): FloodFeatures {
  const discharge = series.get(day)?.river_discharge_m3s ?? null;
  // Tiny baselines (dry streams) make the ratio explode, so require a meaningful flow before comparing.
  const ratio = discharge != null && baseline != null && baseline >= 1 ? discharge / baseline : 1;
  return {
    rain_1d_mm: round(series.get(day)?.precipitation_mm ?? 0),
    rain_3d_mm: round(rainSum(series, day, 3)),
    rain_7d_mm: round(rainSum(series, day, 7)),
    river_discharge_m3s: round(discharge ?? 0),
    discharge_ratio: round(ratio, 3),
  };
}

/** One prediction row per forecast day for a region. */
export function buildFloodRows(regionId: string, series: WeatherSeries, referenceDate: string): PredictRow[] {
  const baseline = baselineDischarge(series, referenceDate);
  return dateRange(referenceDate, addDays(referenceDate, HORIZON_DAYS - 1)).map((day) => ({
    region_id: regionId,
    valid_for: day,
    features: floodFeatures(series, day, baseline),
  }));
}
