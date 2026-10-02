/**
 * A handful of climate-risk markers for the hero globe. Like the hotspots of the previous hero
 * illustration they are illustrative, not live data: they show the kinds of hazards the platform
 * covers, concentrated around India with a few elsewhere to show that risk is global.
 * Kept free of Three.js so the page can describe them without loading the 3D scene.
 */
import type { Hazard, RiskLevel } from "@climate/shared";

export interface ClimateRiskMarker {
  id: string;
  hazard: Extract<Hazard, "flood" | "heatwave" | "cyclone" | "drought" | "wildfire">;
  level: Extract<RiskLevel, "low" | "moderate" | "high">;
  place: string;
  lat: number;
  lon: number;
}

export const CLIMATE_RISK_MARKERS: ClimateRiskMarker[] = [
  { id: "assam", hazard: "flood", level: "high", place: "Assam", lat: 26.2, lon: 92.9 },
  { id: "rajasthan", hazard: "heatwave", level: "high", place: "Rajasthan", lat: 26.9, lon: 73.8 },
  { id: "odisha", hazard: "cyclone", level: "moderate", place: "Odisha coast", lat: 19.8, lon: 86.1 },
  { id: "marathwada", hazard: "drought", level: "moderate", place: "Marathwada", lat: 19.1, lon: 76.0 },
  { id: "uttarakhand", hazard: "wildfire", level: "low", place: "Uttarakhand", lat: 30.1, lon: 79.2 },
  { id: "philippines", hazard: "cyclone", level: "moderate", place: "Philippines", lat: 13.5, lon: 123.5 },
  { id: "sahel", hazard: "drought", level: "moderate", place: "Sahel", lat: 14.5, lon: 2.0 },
  { id: "australia", hazard: "wildfire", level: "low", place: "South-east Australia", lat: -35.5, lon: 148.5 },
];

/** Muted versions of the platform's risk colours, so they sit quietly on the green globe. */
export const MARKER_COLORS: Record<ClimateRiskMarker["level"], string> = {
  low: "#8fc79b",
  moderate: "#e9b44c",
  high: "#e07a52",
};

const LEVEL_WORDS: Record<ClimateRiskMarker["level"], string> = { low: "lower", moderate: "elevated", high: "high" };

/** Text alternative for screen readers. */
export const CLIMATE_RISK_MARKERS_SUMMARY = `Illustrative climate risk markers: ${CLIMATE_RISK_MARKERS.map(
  (m) => `${m.hazard} risk, ${LEVEL_WORDS[m.level]}, ${m.place}`,
).join("; ")}.`;
