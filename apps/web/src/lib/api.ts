import { useQuery } from "@tanstack/react-query";
import type { RegionDetail, RegionRiskCollection, RiskSummary, RunSummary } from "@climate/shared";

const BASE = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null) qs.set(k, String(v));
  const res = await fetch(`${BASE}${path}${qs.size ? `?${qs}` : ""}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (body as { error?: string }).error ?? res.statusText);
  return body as T;
}

export const useRuns = () => useQuery({ queryKey: ["runs"], queryFn: () => get<RunSummary[]>("/api/runs") });

export const useRiskMap = (run?: number, date?: string) =>
  useQuery({
    queryKey: ["risk-map", run, date],
    queryFn: () => get<RegionRiskCollection>("/api/risk/map", { run, date }),
    placeholderData: (prev) => prev,
  });

export const useRiskSummary = (run?: number, date?: string) =>
  useQuery({
    queryKey: ["risk-summary", run, date],
    queryFn: () => get<RiskSummary>("/api/risk/summary", { run, date }),
    placeholderData: (prev) => prev,
  });

export const useRegion = (id: string | undefined, run?: number) =>
  useQuery({
    queryKey: ["region", id, run],
    queryFn: () => get<RegionDetail>(`/api/regions/${encodeURIComponent(id!)}`, { run }),
    enabled: !!id,
  });

export const locateRegion = (lat: number, lon: number) =>
  get<{ id: string; name: string }>("/api/regions/locate", { lat, lon });
