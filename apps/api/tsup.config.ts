import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts", "src/db/migrate.ts", "src/db/seed.ts", "src/pipeline/cli.ts"],
  format: "esm",
  target: "node20",
  outDir: "dist",
  clean: true,
  // The shared package ships TypeScript source, so bundle it into the build.
  noExternal: ["@climate/shared"],
});
