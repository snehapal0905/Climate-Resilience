/**
 * Point → state/district, entirely in the browser, using the same static India boundaries as the
 * Explore map. Coordinates never leave the device: only the resulting state/district slugs are kept.
 *
 * 1. The search index's district bounding boxes narrow the candidates (no network for most points).
 * 2. Only the candidate states' district files are loaded (cached with Explore's queries).
 * 3. Ray-casting point-in-polygon picks the containing district. The boundaries are simplified, so a
 *    point just outside every polygon (coast, border) falls back to the nearest candidate within ~15 km.
 */
import type { QueryClient } from "@tanstack/react-query";
import type { MultiPolygon, Polygon, Position } from "geojson";
import { districtsQuery, geoIndexQuery, type DistrictEntry, type StateEntry } from "../explore/geo";
import type { Coordinates } from "./geolocation";

export interface ResolvedPlace {
  state: StateEntry;
  district: DistrictEntry;
  /** True when the point wasn't inside any (simplified) district polygon and the nearest one was used. */
  nearest: boolean;
}

export class RegionNotFoundError extends Error {}

/** ~15 km in degrees; how far outside a simplified boundary we still accept the nearest district. */
const NEAREST_TOLERANCE_DEG = 0.14;

function inRing([x, y]: [number, number], ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as [number, number];
    const [xj, yj] = ring[j] as [number, number];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polygons(geom: Polygon | MultiPolygon): Position[][][] {
  return geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
}

function contains(geom: Polygon | MultiPolygon, p: [number, number]): boolean {
  // Outer ring must contain the point and no hole may contain it.
  return polygons(geom).some(([outer, ...holes]) => !!outer && inRing(p, outer) && !holes.some((h) => inRing(p, h)));
}

/** Distance (in degrees, longitude scaled by latitude) from a point to a polygon's boundary. */
function distanceTo(geom: Polygon | MultiPolygon, [x, y]: [number, number]): number {
  const k = Math.cos((y * Math.PI) / 180);
  let best = Infinity;
  for (const poly of polygons(geom))
    for (const ring of poly)
      for (let i = 1; i < ring.length; i++) {
        const [x1, y1] = ring[i - 1] as [number, number];
        const [x2, y2] = ring[i] as [number, number];
        const dx = (x2 - x1) * k, dy = y2 - y1;
        const len2 = dx * dx + dy * dy;
        const t = len2 ? Math.max(0, Math.min(1, (((x - x1) * k) * dx + (y - y1) * dy) / len2)) : 0;
        const ex = (x - x1) * k - t * dx, ey = y - y1 - t * dy;
        best = Math.min(best, Math.hypot(ex, ey));
      }
  return best;
}

const inBox = ([x, y]: [number, number], [minX, minY, maxX, maxY]: number[], pad = 0) =>
  x >= minX! - pad && x <= maxX! + pad && y >= minY! - pad && y <= maxY! + pad;

export async function resolvePlace(queryClient: QueryClient, { lat, lon }: Coordinates): Promise<ResolvedPlace> {
  const point: [number, number] = [lon, lat];
  const index = await queryClient.fetchQuery(geoIndexQuery);

  const candidates = index.districts.filter((d) => inBox(point, d.bbox, NEAREST_TOLERANCE_DEG));
  if (candidates.length === 0) throw new RegionNotFoundError("outside coverage");

  const stateSlugs = [...new Set(candidates.map((d) => d.state))];
  const files = await Promise.all(stateSlugs.map((s) => queryClient.fetchQuery(districtsQuery(s))));
  const features = files.flatMap((f) => f.features).filter((f) => candidates.some((c) => c.state === f.properties.state && c.slug === f.properties.slug));

  let match = features.find((f) => (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") && contains(f.geometry, point));
  let nearest = false;
  if (!match) {
    let best = Infinity;
    for (const f of features) {
      if (f.geometry.type !== "Polygon" && f.geometry.type !== "MultiPolygon") continue;
      const d = distanceTo(f.geometry, point);
      if (d < best) [best, match] = [d, f];
    }
    if (!match || best > NEAREST_TOLERANCE_DEG) throw new RegionNotFoundError("outside coverage");
    nearest = true;
  }

  const district = index.districts.find((d) => d.state === match!.properties.state && d.slug === match!.properties.slug);
  const state = index.states.find((s) => s.slug === match!.properties.state);
  if (!district || !state) throw new RegionNotFoundError("index mismatch");
  return { state, district, nearest };
}
