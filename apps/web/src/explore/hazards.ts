/**
 * Hazard layers shown in the Explore hazard selector. Only hazards with a model behind them are
 * `available`; the rest are listed so the UI is ready for them, but they have no data or logic yet.
 */
export type HazardLayerId = "flood" | "heatwave" | "cyclone" | "drought" | "landslide" | "wildfire";

export interface HazardLayer {
  id: HazardLayerId;
  label: string;
  available: boolean;
}

export const HAZARD_LAYERS: readonly HazardLayer[] = [
  { id: "flood", label: "Flood", available: true },
  { id: "heatwave", label: "Heatwave", available: false },
  { id: "cyclone", label: "Cyclone", available: false },
  { id: "drought", label: "Drought", available: false },
  { id: "landslide", label: "Landslide", available: false },
  { id: "wildfire", label: "Wildfire", available: false },
];

export const DEFAULT_HAZARD: HazardLayerId = "flood";
