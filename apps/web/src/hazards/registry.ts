/**
 * Hazard registry: the single source of truth for how hazards are named, described and shown.
 * IDs and "which hazards have a model" come from @climate/shared; everything the UI needs to
 * present a hazard lives here. Explore, /hazards and the landing page all read from this file.
 *
 * Hazard identity colours are for icons and tiles only. They are deliberately muted and are never
 * used for map fills or risk: severity always uses RISK_LEVEL_META (low → severe).
 */
import { HAZARD_IDS, HazardSchema, isModelledHazard, type Hazard } from "@climate/shared";

export type HazardStatus = "active" | "coming_soon";

export interface HazardMeta {
  id: Hazard;
  name: string;
  description: string;
  /** Status follows the shared MODELLED_HAZARDS list, so adding a model activates the hazard here. */
  status: HazardStatus;
  /** Identity colour (icon ink); tints are derived from it. Not a risk colour. */
  color: string;
  /** What data the platform has for this hazard, in plain words. */
  dataAvailability: string;
  /** Shown on the Coming Soon state; describes what is planned, not what exists. */
  comingSoon?: string;
  /** Existing detailed dashboard for this hazard's predictions, if there is one. */
  dashboardPath?: string;
}

type HazardCopy = Omit<HazardMeta, "id" | "status">;

const COPY: Record<Hazard, HazardCopy> = {
  flood: {
    name: "Flood",
    description: "River, rainfall and surface-water related flooding risk.",
    color: "#1f6f7f",
    dataAvailability: "District-level forecasts where a flood model is running",
    dashboardPath: "/assam-flood-watch",
  },
  heatwave: {
    name: "Heatwave",
    description: "Periods of unusually high temperatures that may affect health and infrastructure.",
    color: "#a8552f",
    dataAvailability: "Not yet available",
    comingSoon: "ClimateResilience is building regional heat-risk intelligence using weather, exposure and environmental data.",
  },
  cyclone: {
    name: "Cyclone",
    description: "Severe weather systems bringing strong winds, heavy rainfall and coastal impacts.",
    color: "#4f5f98",
    dataAvailability: "Not yet available",
    comingSoon: "ClimateResilience is building cyclone-risk intelligence for coastal regions using weather and exposure data.",
  },
  drought: {
    name: "Drought",
    description: "Extended periods of below-normal rainfall and water availability.",
    color: "#8f7433",
    dataAvailability: "Not yet available",
    comingSoon: "ClimateResilience is building drought-risk intelligence using rainfall, water and land-condition data.",
  },
  landslide: {
    name: "Landslide",
    description: "Ground instability triggered by rainfall, terrain and geological conditions.",
    color: "#76584a",
    dataAvailability: "Not yet available",
    comingSoon: "ClimateResilience is building landslide-risk intelligence using rainfall, terrain and geological data.",
  },
  wildfire: {
    name: "Wildfire",
    description: "Vegetation and landscape fire risk influenced by heat, dryness and environmental conditions.",
    color: "#9c4636",
    dataAvailability: "Not yet available",
    comingSoon: "ClimateResilience is building wildfire-risk intelligence using weather, vegetation and land-condition data.",
  },
  lightning: {
    name: "Lightning",
    description: "Thunderstorm-related lightning hazards.",
    color: "#65559c",
    dataAvailability: "Not yet available",
    comingSoon: "ClimateResilience is building lightning-risk intelligence using thunderstorm and weather data.",
  },
  earthquake: {
    name: "Earthquake",
    description: "Ground shaking caused by seismic activity.",
    color: "#5c6660",
    dataAvailability: "Not yet available",
    comingSoon: "ClimateResilience is building earthquake information using seismic hazard and exposure data.",
  },
  tsunami: {
    name: "Tsunami",
    description: "Large sea disturbances that can generate coastal waves.",
    color: "#2d5277",
    dataAvailability: "Not yet available",
    comingSoon: "ClimateResilience is building tsunami information for coastal regions using ocean hazard and exposure data.",
  },
};

/** All hazards in display order. */
export const HAZARD_REGISTRY: readonly HazardMeta[] = HAZARD_IDS.map((id) => ({
  id,
  status: isModelledHazard(id) ? "active" : "coming_soon",
  ...COPY[id],
}));

const BY_ID = new Map(HAZARD_REGISTRY.map((h) => [h.id, h]));

export function getHazard(id: Hazard): HazardMeta {
  return BY_ID.get(id)!;
}

export const DEFAULT_HAZARD: Hazard = "flood";

/** Parses a hazard ID from untrusted input (URL); unknown values return undefined. */
export function parseHazard(value: string | null | undefined): Hazard | undefined {
  const r = HazardSchema.safeParse(value);
  return r.success ? r.data : undefined;
}

export const exploreHazardHref = (id: Hazard) => `/explore?hazard=${id}`;
export const prepareHazardHref = (id: Hazard) => `/prepare/${id}`;

/**
 * The three distinct states a hazard can be in for a place. They are never collapsed:
 *   data        — the hazard is modelled and a prediction exists here
 *   no_data     — the hazard is modelled, but there is no prediction for this place/date
 *   coming_soon — no model exists for the hazard yet
 */
export type HazardAvailability = "data" | "no_data" | "coming_soon";

export function hazardAvailability(hazard: Hazard, hasPrediction: boolean): HazardAvailability {
  if (getHazard(hazard).status !== "active") return "coming_soon";
  return hasPrediction ? "data" : "no_data";
}
