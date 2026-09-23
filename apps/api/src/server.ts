import { createApp } from "./app.js";
import { sql } from "./db/client.js";
import { env } from "./env.js";
import { closeRedis, pipelineQueue, startPipelineWorker } from "./jobs/pipelineQueue.js";
import { logger } from "./logger.js";

const server = createApp().listen(env.PORT, () => logger.info(`API listening on http://localhost:${env.PORT}`));
const worker = await startPipelineWorker();

async function shutdown() {
  logger.info("Shutting down");
  server.close();
  await worker.close();
  await pipelineQueue.close();
  await closeRedis();
  await sql.end();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
