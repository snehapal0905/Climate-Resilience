import {
  customType,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import type { Factor, FloodFeatures, ModelledHazard, RiskLevel, RunMode } from "@climate/shared";

/** PostGIS geometry column. Read it with ST_AsGeoJSON and write it with ST_GeomFromGeoJSON in raw SQL. */
const multiPolygon = customType<{ data: string }>({
  dataType: () => "geometry(MultiPolygon, 4326)",
});

export const regions = pgTable(
  "regions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    state: text("state").notNull(),
    censusCode: text("census_code"),
    population: integer("population"),
    geom: multiPolygon("geom").notNull(),
    /** A point guaranteed to lie inside the region (ST_PointOnSurface); weather is sampled here. */
    refLat: doublePrecision("ref_lat").notNull(),
    refLon: doublePrecision("ref_lon").notNull(),
  },
  (t) => [index("regions_geom_idx").using("gist", t.geom)],
);

export const predictionRuns = pgTable("prediction_runs", {
  id: serial("id").primaryKey(),
  mode: text("mode").$type<RunMode>().notNull(),
  hazard: text("hazard").$type<ModelledHazard>().notNull(),
  referenceDate: date("reference_date").notNull(),
  label: text("label").notNull(),
  status: text("status").$type<"running" | "completed" | "failed">().notNull().default("running"),
  modelVersion: text("model_version"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

/** Snapshot of the weather inputs a run used, so every prediction can be traced back to its data. */
export const runWeather = pgTable(
  "run_weather",
  {
    runId: integer("run_id")
      .notNull()
      .references(() => predictionRuns.id, { onDelete: "cascade" }),
    regionId: text("region_id")
      .notNull()
      .references(() => regions.id),
    date: date("date").notNull(),
    precipitationMm: real("precipitation_mm"),
    temperatureMaxC: real("temperature_max_c"),
    riverDischargeM3s: real("river_discharge_m3s"),
    isForecast: boolean("is_forecast").notNull(),
  },
  (t) => [primaryKey({ columns: [t.runId, t.regionId, t.date] })],
);

export const riskPredictions = pgTable(
  "risk_predictions",
  {
    runId: integer("run_id")
      .notNull()
      .references(() => predictionRuns.id, { onDelete: "cascade" }),
    regionId: text("region_id")
      .notNull()
      .references(() => regions.id),
    validFor: date("valid_for").notNull(),
    riskScore: real("risk_score").notNull(),
    riskLevel: text("risk_level").$type<RiskLevel>().notNull(),
    topFactors: jsonb("top_factors").$type<Factor[]>().notNull(),
    features: jsonb("features").$type<FloodFeatures>().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.runId, t.regionId, t.validFor] }),
    index("risk_predictions_run_date_idx").on(t.runId, t.validFor),
  ],
);
