import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { sql } from "./db/client.js";
import { env } from "./env.js";
import { errorHandler } from "./lib/http.js";
import { redactLocation } from "./lib/redact.js";
import { logger } from "./logger.js";
import { mlHealth } from "./pipeline/mlClient.js";
import { regionsRouter } from "./routes/regions.js";
import { riskRouter } from "./routes/risk.js";
import { runsRouter } from "./routes/runs.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(",") }));
  app.use(express.json({ limit: "100kb" }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== "test",
      // Never write precise locations (location lookups) to the logs.
      serializers: { req: redactLocation },
    }),
  );

  app.get("/api/health", async (_req, res) => {
    const [dbOk, ml] = await Promise.all([
      sql`SELECT 1`.then(() => true).catch(() => false),
      mlHealth().catch(() => null),
    ]);
    res.status(dbOk ? 200 : 503).json({
      status: dbOk && ml ? "ok" : "degraded",
      database: dbOk,
      ml_service: ml ? { ok: true, model_version: ml.model_version } : { ok: false },
    });
  });

  app.use("/api/risk", riskRouter);
  app.use("/api/regions", regionsRouter);
  app.use("/api/runs", runsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  app.use(errorHandler);
  return app;
}
