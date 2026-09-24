import { describe, expect, it } from "vitest";
import { HAZARD_IDS, HazardSchema, isModelledHazard, MODELLED_HAZARDS, PredictRequestSchema } from "@climate/shared";

const row = {
  region_id: "as-barpeta",
  valid_for: "2022-06-14",
  features: { rain_1d_mm: 10, rain_3d_mm: 30, rain_7d_mm: 70, river_discharge_m3s: 100, discharge_ratio: 1 },
};

describe("hazard contract", () => {
  it("knows every platform hazard, but only flood has a model", () => {
    expect(HAZARD_IDS).toHaveLength(9);
    for (const h of HAZARD_IDS) expect(HazardSchema.parse(h)).toBe(h);
    expect(MODELLED_HAZARDS).toEqual(["flood"]);
    expect(isModelledHazard("flood")).toBe(true);
    expect(isModelledHazard("heatwave")).toBe(false);
  });

  it("accepts prediction requests only for modelled hazards", () => {
    expect(PredictRequestSchema.safeParse({ hazard: "flood", rows: [row] }).success).toBe(true);
    expect(PredictRequestSchema.safeParse({ hazard: "heatwave", rows: [row] }).success).toBe(false);
    expect(PredictRequestSchema.safeParse({ hazard: "cyclone", rows: [row] }).success).toBe(false);
  });
});
