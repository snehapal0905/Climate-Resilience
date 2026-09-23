import { useCallback, useSyncExternalStore } from "react";

/**
 * The selected run, day and region live in the URL, so any view can be shared as a link
 * (e.g. an official forwarding "this district, this day" on WhatsApp).
 */
export interface ViewState {
  run?: number;
  date?: string;
  region?: string;
}

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

function read(search: string): ViewState {
  const p = new URLSearchParams(search);
  const run = Number(p.get("run"));
  return {
    run: Number.isInteger(run) && run > 0 ? run : undefined,
    date: p.get("date") ?? undefined,
    region: p.get("region") ?? undefined,
  };
}

export function useViewState(): [ViewState, (patch: Partial<ViewState>) => void] {
  const search = useSyncExternalStore(subscribe, () => window.location.search);
  const state = read(search);

  const update = useCallback((patch: Partial<ViewState>) => {
    const next = { ...read(window.location.search), ...patch };
    const p = new URLSearchParams();
    if (next.run) p.set("run", String(next.run));
    if (next.date) p.set("date", next.date);
    if (next.region) p.set("region", next.region);
    const qs = p.toString();
    window.history.pushState(null, "", qs ? `?${qs}` : window.location.pathname);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return [state, update];
}
