import { and, desc, eq, sql as dsql } from "drizzle-orm";
import type { RunSummary } from "@climate/shared";
import { db } from "../db/client.js";
import { predictionRuns, riskPredictions } from "../db/schema.js";
import { HttpError } from "../lib/http.js";

type RunRow = typeof predictionRuns.$inferSelect;

async function toSummary(run: RunRow): Promise<RunSummary> {
  const dates = await db
    .selectDistinct({ validFor: riskPredictions.validFor })
    .from(riskPredictions)
    .where(eq(riskPredictions.runId, run.id))
    .orderBy(riskPredictions.validFor);
  return {
    id: run.id,
    mode: run.mode,
    hazard: run.hazard,
    reference_date: run.referenceDate,
    model_version: run.modelVersion ?? "unknown",
    label: run.label,
    created_at: run.createdAt.toISOString(),
    valid_dates: dates.map((d) => d.validFor),
  };
}

/**
 * The run a request refers to: an explicit id, otherwise the newest completed live run,
 * otherwise the newest completed run of any mode. Returns null if nothing has run yet.
 */
export async function resolveRun(runId?: number): Promise<RunSummary | null> {
  if (runId != null) {
    const [run] = await db
      .select()
      .from(predictionRuns)
      .where(and(eq(predictionRuns.id, runId), eq(predictionRuns.status, "completed")));
    if (!run) throw new HttpError(404, `Run ${runId} not found`);
    return toSummary(run);
  }
  const [run] = await db
    .select()
    .from(predictionRuns)
    .where(eq(predictionRuns.status, "completed"))
    .orderBy(dsql`${predictionRuns.mode} = 'live' DESC`, desc(predictionRuns.createdAt))
    .limit(1);
  return run ? toSummary(run) : null;
}

/** Latest completed live run plus the latest completed run for each distinct replay date. */
export async function listRuns(): Promise<RunSummary[]> {
  const rows = await db.execute<{ id: number }>(dsql`
    SELECT id FROM (
      SELECT DISTINCT ON (mode, CASE WHEN mode = 'replay' THEN reference_date END) id, mode, created_at
      FROM prediction_runs
      WHERE status = 'completed'
      ORDER BY mode, CASE WHEN mode = 'replay' THEN reference_date END, created_at DESC
    ) latest
    ORDER BY mode = 'live' DESC, created_at DESC`);
  const runs = await Promise.all(rows.map((r) => resolveRun(Number(r.id))));
  return runs.filter((r): r is RunSummary => r != null);
}

/** Picks the requested date if the run has it, else the run's reference date. */
export function resolveDate(run: RunSummary, date?: string): string {
  if (date && run.valid_dates.includes(date)) return date;
  if (date) throw new HttpError(400, `Run ${run.id} has no predictions for ${date}`);
  return run.valid_dates.includes(run.reference_date) ? run.reference_date : run.valid_dates[0]!;
}
