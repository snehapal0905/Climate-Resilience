/**
 * Model tester: run the flood model for any point in India on any day, outside the scheduled
 * pipeline. Fetches that point's weather, builds the same features the pipeline would, optionally
 * replaces some of them ("what if" values), and returns the model's prediction. Nothing is stored.
 */
import { Router } from "express";
import { z } from "zod";
import type { ModelTesterResponse } from "@climate/shared";
import { addDays, todayInIndia } from "../lib/dates.js";
import { HttpError } from "../lib/http.js";
import { BASELINE_DAYS, baselineDischarge, floodFeatures } from "../pipeline/features.js";
import { predict } from "../pipeline/mlClient.js";
import { fetchWeather } from "../pipeline/openMeteo.js";

/** The archive API lags a few days behind today, so recent days come from the forecast API. */
const ARCHIVE_LAG_DAYS = 7;
const MAX_FORECAST_DAYS = 14;

const BodySchema = z.object({
  // Roughly India's bounding box
  lat: z.number().min(6).max(37.5),
  lon: z.number().min(68).max(97.5),
  date: z.iso.date(),
  overrides: z
    .object({
      rain_1d_mm: z.number().nonnegative(),
      rain_3d_mm: z.number().nonnegative(),
      rain_7d_mm: z.number().nonnegative(),
      api_index: z.number().nonnegative(),
    })
    .partial()
    .default({}),
});

export const modelTesterRouter = Router();

modelTesterRouter.post("/", async (req, res) => {
  const { lat, lon, date, overrides } = BodySchema.parse(req.body);
  const today = todayInIndia();
  if (date < "1985-01-01") throw new HttpError(400, "Pick a date from 1985 onwards");
  if (date > addDays(today, MAX_FORECAST_DAYS)) throw new HttpError(400, `Pick a date at most ${MAX_FORECAST_DAYS} days ahead`);

  const point = { lat, lon };
  const mode = date < addDays(today, -ARCHIVE_LAG_DAYS) ? "replay" : "live";
  const [series] = await fetchWeather(mode, [point], addDays(date, -BASELINE_DAYS), date);
  if (!series?.get(date)) throw new HttpError(502, "No weather data available for this place and date");

  const observed = floodFeatures(series, date, baselineDischarge(series, date), point);
  const features = { ...observed, ...overrides };
  const response = await predict({ hazard: "flood", rows: [{ region_id: "model-tester", valid_for: date, features }] });
  const prediction = response.predictions[0]!;

  const body: ModelTesterResponse = {
    model_version: response.model_version,
    date,
    source: date > today ? "forecast" : "observed",
    observed,
    features,
    prediction: {
      valid_for: prediction.valid_for,
      risk_score: prediction.risk_score,
      risk_level: prediction.risk_level,
      top_factors: prediction.top_factors,
    },
  };
  res.json(body);
});
