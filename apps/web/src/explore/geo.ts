/**
 * India boundary data for the Explore map. Static files in /public/geo, generated from
 * github.com/udit-001/india-maps-data (Census 2011 districts), the same source as the Assam
 * regions in the database:
 *   india-states.geojson      36 states/UTs, loaded up front
 *   india-index.json          names + bounding boxes of every state and district (for search/zoom)
 *   districts/<state>.geojson one file per state, loaded only when that state is opened
 * Risk data never comes from these files; it comes from the risk API.
 */
import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection, Geometry } from "geojson";

export type BBox = [number, number, number, number];

export interface StateEntry {
  slug: string;
  name: string;
  bbox: BBox;
}
export interface DistrictEntry {
  slug: string;
  name: string;
  /** slug of the parent state */
  state: string;
  bbox: BBox;
}
export interface GeoIndex {
  states: StateEntry[];
  districts: DistrictEntry[];
}

export type StatesCollection = FeatureCollection<Geometry, { slug: string; name: string }>;
export type DistrictsCollection = FeatureCollection<Geometry, { key: string; slug: string; name: string; state: string }>;

export const INDIA_BBOX: BBox = [68.1, 6.7, 97.4, 37.1];

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return (await res.json()) as T;
}

const forever = { staleTime: Infinity, gcTime: Infinity, retry: 2 } as const;

export const useStatesGeo = () => useQuery({ queryKey: ["geo", "states"], queryFn: () => getJson<StatesCollection>("/geo/india-states.geojson"), ...forever });

/** Query definitions, shared by the hooks below and by imperative callers (e.g. location lookup) so they hit one cache. */
export const geoIndexQuery = { queryKey: ["geo", "index"], queryFn: () => getJson<GeoIndex>("/geo/india-index.json"), ...forever };
export const districtsQuery = (stateSlug: string) => ({
  queryKey: ["geo", "districts", stateSlug],
  queryFn: () => getJson<DistrictsCollection>(`/geo/districts/${stateSlug}.geojson`),
  ...forever,
});

export const useGeoIndex = () => useQuery(geoIndexQuery);

export const useDistrictsGeo = (stateSlug: string | undefined, enabled: boolean) =>
  useQuery({ ...districtsQuery(stateSlug ?? ""), enabled: !!stateSlug && enabled });

/** Case- and accent-insensitive form used for matching names and search. */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
