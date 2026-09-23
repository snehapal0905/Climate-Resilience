/**
 * The prediction pipeline:
 * regions → Open-Meteo weather → feature rows → ML /predict → stored predictions.
 */
import { eq } from "drizzle-orm";
import type { RunMode } from "@climate/shared";
import { db } from "../db/client.js";
import { predictionRuns, regions, riskPredictions, runWeather } from "../db/schema.js";
import { todayInIndia } from "../lib/dates.js";
import { logger } from "../logger.js";
import { buildFloodRows, requiredWindow } from "./features.js";
import { predict } from "./mlClient.js";
import { fetchWeather } from "./openMeteo.js";

export interface RunOptions {
  mode: RunMode;
  /** Required for replays; live runs always use today's date in India. */
  referenceDate?: string;
  label?: string;
}

export async function runPipeline(opts: RunOptions): Promise<number> {
  const referenceDate = opts.mode === "live" ? todayInIndia() : opts.referenceDate;
  if (!referenceDate) throw new Error("Replay runs need a referenceDate");
  if (opts.mode === "replay" && referenceDate > todayInIndia()) throw new Error("Replay date must be in the past");

  const [run] = await db
    .insert(predictionRuns)
    .values({
      mode: opts.mode,
      hazard: "flood",
      referenceDate,
      label: opts.label ?? (opts.mode === "live" ? `Live forecast ${referenceDate}` : `Replay ${referenceDate}`),
    })
    .returning({ id: predictionRuns.id });
  const runId = run!.id;
  const log = logger.child({ runId, mode: opts.mode, referenceDate });

  try {
    const regionRows = await db
      .select({ id: regions.id, lat: regions.refLat, lon: regions.refLon })
      .from(regions);
    if (regionRows.length === 0) throw new Error("No regions in the database, run `npm run db:seed` first");

    const { start, end } = requiredWindow(referenceDate);
    log.info({ regions: regionRows.length, start, end }, "Fetching weather");
    const series = await fetchWeather(opts.mode, regionRows, start, end);

    const predictRows = regionRows.flatMap((r, i) => buildFloodRows(r.id, series[i]!, referenceDate));
    log.info({ rows: predictRows.length }, "Requesting predictions");
    const response = await predict({ hazard: "flood", rows: predictRows });
    const featuresByKey = new Map(predictRows.map((r) => [`${r.region_id}|${r.valid_for}`, r.features]));

    await db.transaction(async (tx) => {
      const weatherValues = regionRows.flatMap((r, i) =>
        [...series[i]!.entries()].map(([date, w]) => ({
          runId,
          regionId: r.id,
          date,
          precipitationMm: w.precipitation_mm,
          temperatureMaxC: w.temperature_max_c,
          riverDischargeM3s: w.river_discharge_m3s,
          isForecast: date > referenceDate,
        })),
      );
      for (let i = 0; i < weatherValues.length; i += 1000) {
        await tx.insert(runWeather).values(weatherValues.slice(i, i + 1000));
      }
      await tx.insert(riskPredictions).values(
        response.predictions.map((p) => ({
          runId,
          regionId: p.region_id,
          validFor: p.valid_for,
          riskScore: p.risk_score,
          riskLevel: p.risk_level,
          topFactors: p.top_factors,
          features: featuresByKey.get(`${p.region_id}|${p.valid_for}`)!,
        })),
      );
      await tx
        .update(predictionRuns)
        .set({ status: "completed", modelVersion: response.model_version, completedAt: new Date() })
        .where(eq(predictionRuns.id, runId));
    });

    log.info({ predictions: response.predictions.length, model: response.model_version }, "Run completed");
    return runId;
  } catch (err) {
    await db
      .update(predictionRuns)
      .set({ status: "failed", error: err instanceof Error ? err.message : String(err), completedAt: new Date() })
      .where(eq(predictionRuns.id, runId));
    log.error({ err }, "Run failed");
    throw err;
  }
}
