/**
 * Location → hazard risk collection.
 *
 *   place (state + district)
 *     → for every hazard in the registry, one assessment:
 *         coming_soon  no model exists for the hazard
 *         no_data      modelled, but no prediction covers this district (never shown as "low")
 *         data         prediction from the existing risk API
 *
 * Predictions come only from the existing APIs (/api/risk/map for the district's level, /api/regions/:id
 * for its 7-day timeline and top factors). Adding a hazard model later means its runs appear in the
 * risk API; this collection picks them up without changes to the page.
 */
import type { RiskLevel, RiskPoint, RunSummary } from "@climate/shared";
import { useGeoIndex } from "../explore/geo";
import { useRiskRegions } from "../explore/riskRegions";
import { HAZARD_REGISTRY, hazardAvailability, type HazardAvailability, type HazardMeta } from "../hazards/registry";
import { useRegion, useRiskMap } from "../lib/api";
import type { ResolvedPlace } from "./resolvePlace";

export interface HazardAssessment {
  hazard: HazardMeta;
  availability: HazardAvailability;
  /** Loading/error of the data behind this assessment (only relevant for modelled hazards). */
  status: "loading" | "error" | "ready";
  regionId?: string;
  level?: RiskLevel | null;
  score?: number | null;
  validFor?: string;
  run?: RunSummary | null;
  /** 7-day outlook with top factors per day, when available */
  timeline?: RiskPoint[];
}

export function usePlaceRisk(place: ResolvedPlace | null): HazardAssessment[] {
  const index = useGeoIndex();
  // Default run = latest live forecast; the page never shows replays as "your" risk.
  const risk = useRiskMap(undefined, undefined);
  const { regions } = useRiskRegions(risk.isError ? undefined : risk.data, index.data);

  const region = place ? regions.find((r) => r.state_slug === place.state.slug && r.district_slug === place.district.slug) : undefined;
  const run = risk.data?.run ?? null;
  const detail = useRegion(region?.id, run?.id);

  return HAZARD_REGISTRY.map((hazard): HazardAssessment => {
    if (hazard.status !== "active") return { hazard, availability: "coming_soon", status: "ready" };
    if (risk.isError) return { hazard, availability: "no_data", status: "error" };
    if (!risk.data || !index.data) return { hazard, availability: "no_data", status: "loading" };

    // Only predictions produced for this hazard count.
    const matching = run?.hazard === hazard.id ? region : undefined;
    const hasPrediction = !!matching && matching.risk_level != null;
    const availability = hazardAvailability(hazard.id, hasPrediction);
    if (availability !== "data" || !matching) return { hazard, availability, status: "ready", run };

    const timeline = detail.data?.risk_timeline;
    const today = timeline?.find((p) => p.valid_for === risk.data.valid_for);
    return {
      hazard,
      availability,
      status: detail.isError ? "error" : detail.isLoading ? "loading" : "ready",
      regionId: matching.id,
      level: today?.risk_level ?? matching.risk_level,
      score: today?.risk_score ?? matching.risk_score,
      validFor: risk.data.valid_for ?? undefined,
      run,
      timeline,
    };
  });
}
