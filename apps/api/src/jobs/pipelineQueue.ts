/**
 * Background pipeline runs on BullMQ: a repeatable live run on PIPELINE_CRON plus on-demand runs
 * from POST /api/runs. Jobs survive restarts and failed runs retry with backoff.
 */
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { runPipeline, type RunOptions } from "../pipeline/run.js";

const QUEUE_NAME = "pipeline";
// BullMQ workers block on Redis, so they need maxRetriesPerRequest: null.
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const pipelineQueue = new Queue<RunOptions>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 60_000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

export async function startPipelineWorker() {
  const worker = new Worker<RunOptions, number>(QUEUE_NAME, (job) => runPipeline(job.data), {
    connection,
    concurrency: 1,
  });
  worker.on("failed", (job, err) => logger.error({ jobId: job?.id, err }, "Pipeline job failed"));

  if (env.PIPELINE_CRON) {
    await pipelineQueue.upsertJobScheduler(
      "live-forecast",
      { pattern: env.PIPELINE_CRON, tz: "Asia/Kolkata" },
      { name: "live", data: { mode: "live" } },
    );
    logger.info({ cron: env.PIPELINE_CRON }, "Scheduled live pipeline");
  } else {
    await pipelineQueue.removeJobScheduler("live-forecast");
  }
  return worker;
}

export async function closeRedis() {
  await connection.quit();
}
