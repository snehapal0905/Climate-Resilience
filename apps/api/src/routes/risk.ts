import { Router } from "express";
import type { Geometry } from "geojson";
import { z } from "zod";
import {
  RISK_LEVELS,
  type RegionRiskCollection,
  type RiskLevel,
  type RiskSummary,
} from "@climate/shared";
import { sql } from "../db/client.js";
import { resolveDate, resolveRun } from "../services/runs.js";

const QuerySchema = z.object({
  run: z.coerce.number().int().positive().optional(),
  date: z.iso.date().optional(),
});

/** Simplification tolerance in degrees (~200 m): plenty for a state-level map, and far smaller payloads. */
const SIMPLIFY_TOLERANCE = 0.002;

export const riskRouter = Router();

riskRouter.get("/map", async (req, res) => {
  const q = QuerySchema.parse(req.query);
  const run = await resolveRun(q.run);
  const validFor = run ? resolveDate(run, q.date) : null;

  const rows = await sql<
    Array<{ id: string; name: string; state: string; population: number | null; geometry: string; risk_score: number | null; risk_level: RiskLevel | null }>
  >`
    SELECT r.id, r.name, r.state, r.population,
           ST_AsGeoJSON(ST_SimplifyPreserveTopology(r.geom, ${SIMPLIFY_TOLERANCE}), 5) AS geometry,
           p.risk_score, p.risk_level
    FROM regions r
    LEFT JOIN risk_predictions p
      ON p.region_id = r.id AND p.run_id = ${run?.id ?? null} AND p.valid_for = ${validFor}
    ORDER BY r.name`;

  const body: RegionRiskCollection = {
    type: "FeatureCollection",
    run,
    valid_for: validFor,
    features: rows.map((r) => ({
      type: "Feature",
      id: r.id,
      geometry: JSON.parse(r.geometry) as Geometry,
      properties: {
        id: r.id,
        name: r.name,
        state: r.state,
        population: r.population,
        risk_score: r.risk_score,
        risk_level: r.risk_level,
      },
    })),
  };
  res.set("Cache-Control", "public, max-age=300").json(body);
});

riskRouter.get("/summary", async (req, res) => {
  const q = QuerySchema.parse(req.query);
  const run = await resolveRun(q.run);
  const counts = Object.fromEntries(RISK_LEVELS.map((l) => [l, 0])) as Record<RiskLevel, number>;
  if (!run) {
    res.json({ run: null, valid_for: null, counts, top_regions: [] } satisfies RiskSummary);
    return;
  }
  const validFor = resolveDate(run, q.date);
  const rows = await sql<Array<{ id: string; name: string; risk_score: number; risk_level: RiskLevel }>>`
    SELECT r.id, r.name, p.risk_score, p.risk_level
    FROM risk_predictions p JOIN regions r ON r.id = p.region_id
    WHERE p.run_id = ${run.id} AND p.valid_for = ${validFor}
    ORDER BY p.risk_score DESC`;
  for (const r of rows) counts[r.risk_level] += 1;

  res.json({ run, valid_for: validFor, counts, top_regions: rows.slice(0, 5) } satisfies RiskSummary);
});
