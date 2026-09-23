import { Router } from "express";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { RegionDetail } from "@climate/shared";
import { db, sql } from "../db/client.js";
import { regions, riskPredictions, runWeather } from "../db/schema.js";
import { HttpError } from "../lib/http.js";
import { addDays } from "../lib/dates.js";
import { resolveRun } from "../services/runs.js";

/** Days of observed weather shown before the reference date on the region page. */
const HISTORY_DAYS = 14;

export const regionsRouter = Router();

/** Which region contains a point — powers "Am I safe?" from the browser's geolocation. */
regionsRouter.get("/locate", async (req, res) => {
  const { lat, lon } = z
    .object({ lat: z.coerce.number().min(-90).max(90), lon: z.coerce.number().min(-180).max(180) })
    .parse(req.query);
  const [hit] = await sql<Array<{ id: string; name: string }>>`
    SELECT id, name FROM regions
    WHERE ST_Intersects(geom, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326))
    LIMIT 1`;
  if (!hit) throw new HttpError(404, "This location is outside the covered regions");
  res.json(hit);
});

regionsRouter.get("/:id", async (req, res) => {
  const { run: runId } = z.object({ run: z.coerce.number().int().positive().optional() }).parse(req.query);

  const [region] = await db.select().from(regions).where(eq(regions.id, req.params.id));
  if (!region) throw new HttpError(404, `Region ${req.params.id} not found`);

  const run = await resolveRun(runId);
  const detail: RegionDetail = {
    id: region.id,
    name: region.name,
    population: region.population,
    centroid: { lat: region.refLat, lon: region.refLon },
    run,
    risk_timeline: [],
    weather: [],
  };

  if (run) {
    const [timeline, weather] = await Promise.all([
      db
        .select()
        .from(riskPredictions)
        .where(and(eq(riskPredictions.runId, run.id), eq(riskPredictions.regionId, region.id)))
        .orderBy(asc(riskPredictions.validFor)),
      db
        .select()
        .from(runWeather)
        .where(and(eq(runWeather.runId, run.id), eq(runWeather.regionId, region.id)))
        .orderBy(asc(runWeather.date)),
    ]);
    const historyStart = addDays(run.reference_date, -HISTORY_DAYS);
    detail.risk_timeline = timeline.map((p) => ({
      valid_for: p.validFor,
      risk_score: p.riskScore,
      risk_level: p.riskLevel,
      top_factors: p.topFactors,
    }));
    detail.weather = weather
      .filter((w) => w.date >= historyStart)
      .map((w) => ({
        date: w.date,
        precipitation_mm: w.precipitationMm,
        river_discharge_m3s: w.riverDischargeM3s,
        temperature_max_c: w.temperatureMaxC,
        is_forecast: w.isForecast,
      }));
  }

  res.json(detail);
});
