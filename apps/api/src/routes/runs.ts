import { Router, type RequestHandler } from "express";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { RunModeSchema } from "@climate/shared";
import { env } from "../env.js";
import { HttpError } from "../lib/http.js";
import { pipelineQueue } from "../jobs/pipelineQueue.js";
import { listRuns } from "../services/runs.js";

/** Temporary shared-secret guard; replaced by role-based auth in the auth phase. */
const requireAdminToken: RequestHandler = (req, _res, next) => {
  const given = Buffer.from(req.get("x-admin-token") ?? "");
  const expected = Buffer.from(env.ADMIN_TOKEN);
  if (!env.ADMIN_TOKEN || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw new HttpError(401, "Admin token required");
  }
  next();
};

const TriggerSchema = z
  .object({
    mode: RunModeSchema,
    date: z.iso.date().optional(),
    label: z.string().max(120).optional(),
  })
  .refine((b) => b.mode === "live" || b.date, { message: "date is required for replay runs" });

export const runsRouter = Router();

runsRouter.get("/", async (_req, res) => {
  res.json(await listRuns());
});

runsRouter.post("/", requireAdminToken, async (req, res) => {
  const body = TriggerSchema.parse(req.body);
  const job = await pipelineQueue.add(body.mode, {
    mode: body.mode,
    referenceDate: body.date,
    label: body.label,
  });
  res.status(202).json({ job_id: job.id });
});
