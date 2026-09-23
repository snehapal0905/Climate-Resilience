import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import "./index.css";
import LandingPage from "./landing/LandingPage";

// Loaded on demand so the landing page doesn't download the map and chart libraries.
const App = lazy(() => import("./App"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false } },
});

/**
 * Minimal path-based routing (two pages, full page loads between them):
 *   /assam-flood-watch → the existing Assam Flood Watch dashboard
 *   anything else      → the landing page
 */
const DASHBOARD_PATH = "/assam-flood-watch";
const isDashboard = window.location.pathname.replace(/\/+$/, "") === DASHBOARD_PATH;

if (!isDashboard) {
  document.title = "ClimateResilience · India's Climate Risk & Action Platform";
  document.documentElement.classList.add("lp-root");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isDashboard ? (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={null}>
          <App />
        </Suspense>
      </QueryClientProvider>
    ) : (
      <LandingPage />
    )}
  </StrictMode>,
);
