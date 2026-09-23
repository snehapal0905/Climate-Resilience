import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sql } from "./client.js";
import { logger } from "../logger.js";

// Managed Postgres (Neon/Supabase) doesn't enable PostGIS by default.
await sql`CREATE EXTENSION IF NOT EXISTS postgis`;
await migrate(db, { migrationsFolder: fileURLToPath(new URL("../../drizzle", import.meta.url)) });
logger.info("Migrations applied");
await sql.end();
