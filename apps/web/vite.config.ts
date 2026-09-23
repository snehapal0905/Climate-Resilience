import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // MapLibre 6 loads its worker from a sibling file, which pre-bundling would break.
  optimizeDeps: { exclude: ["maplibre-gl"] },
  server: {
    // In dev the API runs separately; proxying keeps the browser on one origin (no CORS setup needed).
    proxy: { "/api": "http://localhost:4000" },
  },
});
