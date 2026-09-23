import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default("postgres://climate:climate@localhost:5432/climate"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  ML_SERVICE_URL: z.string().default("http://localhost:8000"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  PIPELINE_CRON: z.string().default("0 */3 * * *"),
  /** Guards the manual pipeline trigger until user auth lands. Empty = trigger disabled. */
  ADMIN_TOKEN: z.string().default(""),
});

export const env = EnvSchema.parse(process.env);
