/**
 * Joins the risk API's model regions to the static boundary index, tagging each with the
 * state/district slugs used across the app. Shared by Explore and "Am I Safe?".
 */
import { useMemo } from "react";
import type { RegionRiskCollection } from "@climate/shared";
import type { RiskRegionsCollection } from "./ExploreMap";
import type { RiskRegion } from "./ExplorePanels";
import { normalizeName, type GeoIndex } from "./geo";

export function useRiskRegions(risk: RegionRiskCollection | undefined, index: GeoIndex | undefined) {
  const stateSlugByName = useMemo(() => new Map(index?.states.map((s) => [normalizeName(s.name), s.slug])), [index]);

  const regions = useMemo<RiskRegion[]>(() => {
    if (!risk || !index) return [];
    return risk.features.flatMap((f) => {
      const stateSlug = stateSlugByName.get(normalizeName(f.properties.state));
      if (!stateSlug) return [];
      const match = index.districts.find((d) => d.state === stateSlug && normalizeName(d.name) === normalizeName(f.properties.name));
      return [
        {
          id: f.properties.id,
          name: f.properties.name,
          state_slug: stateSlug,
          district_slug: match?.slug ?? normalizeName(f.properties.name).replace(/ /g, "-"),
          risk_level: f.properties.risk_level,
          risk_score: f.properties.risk_score,
        },
      ];
    });
  }, [risk, index, stateSlugByName]);

  const collection = useMemo<RiskRegionsCollection | undefined>(() => {
    if (!risk) return undefined;
    const byId = new Map(regions.map((r) => [r.id, r]));
    return {
      type: "FeatureCollection",
      features: risk.features.flatMap((f) => {
        const r = byId.get(f.properties.id);
        return r ? [{ type: "Feature" as const, id: r.id, geometry: f.geometry, properties: r }] : [];
      }),
    };
  }, [risk, regions]);

  const statesWithData = useMemo(() => [...new Set(regions.map((r) => r.state_slug))].sort(), [regions]);

  return { regions, collection, statesWithData };
}
