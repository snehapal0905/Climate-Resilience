import { useCallback, useSyncExternalStore } from "react";
import type { Hazard } from "@climate/shared";
import { parseHazard } from "../hazards/registry";

/**
 * Explore selection lives in the URL (/explore?hazard=flood&state=assam&district=sivasagar&run=2&date=…) so the
 * browser back/forward buttons walk the India → state → district drill-down, and views can be shared.
 */
export interface ExploreSelection {
  /** Unset means the default hazard (flood) */
  hazard?: Hazard;
  state?: string;
  district?: string;
  run?: number;
  date?: string;
}

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

function parse(search: string): ExploreSelection {
  const p = new URLSearchParams(search);
  const run = Number(p.get("run"));
  return {
    hazard: parseHazard(p.get("hazard")),
    state: p.get("state") || undefined,
    district: p.get("district") || undefined,
    run: Number.isInteger(run) && run > 0 ? run : undefined,
    date: p.get("date") || undefined,
  };
}

export function exploreHref(sel: ExploreSelection): string {
  const p = new URLSearchParams();
  if (sel.hazard) p.set("hazard", sel.hazard);
  if (sel.state) p.set("state", sel.state);
  if (sel.state && sel.district) p.set("district", sel.district);
  if (sel.run) p.set("run", String(sel.run));
  if (sel.date) p.set("date", sel.date);
  const qs = p.toString();
  return qs ? `/explore?${qs}` : "/explore";
}

export function useExploreSelection(): [ExploreSelection, (next: ExploreSelection) => void] {
  const search = useSyncExternalStore(subscribe, () => window.location.search);
  const selection = parse(search);

  const set = useCallback((next: ExploreSelection) => {
    const href = exploreHref(next);
    if (href === window.location.pathname + window.location.search) return;
    // No scroll-to-top here: drilling into the map should keep the map in view.
    window.history.pushState(null, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return [selection, set];
}
