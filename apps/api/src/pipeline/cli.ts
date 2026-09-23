/**
 * Run the pipeline once from the command line.
 *   npm run pipeline -- --mode live
 *   npm run pipeline -- --mode replay --date 2022-06-14 --label "Assam floods, June 2022"
 */
import { parseArgs } from "node:util";
import { RunModeSchema } from "@climate/shared";
import { sql } from "../db/client.js";
import { runPipeline } from "./run.js";

const { values } = parseArgs({
  options: {
    mode: { type: "string", default: "live" },
    date: { type: "string" },
    label: { type: "string" },
  },
});

try {
  const runId = await runPipeline({
    mode: RunModeSchema.parse(values.mode),
    referenceDate: values.date,
    label: values.label ?? (values.date === "2022-06-14" ? "Replay: Assam floods, June 2022" : undefined),
  });
  console.log(`Run ${runId} completed`);
} finally {
  await sql.end();
}
