import { describe, expect, it } from "vitest";
import { dateRange } from "../lib/dates.js";
import { API_DECAY, apiIndex, buildFloodRows, floodFeatures, HORIZON_DAYS, requiredWindow } from "./features.js";
import type { WeatherSeries } from "./openMeteo.js";

const REF = "2022-06-14";

function series(rain: (date: string) => number, discharge: (date: string) => number | null): WeatherSeries {
  const { start, end } = requiredWindow(REF);
  return new Map(
    dateRange(start, end).map((d) => [
      d,
      {
        precipitation_mm: rain(d),
        precipitation_hours: rain(d) > 0 ? 4 : 0,
        temperature_max_c: 30,
        temperature_min_c: 22,
        temperature_mean_c: 26,
        river_discharge_m3s: discharge(d),
      },
    ]),
  );
}

describe("flood features", () => {
  it("builds one row per horizon day starting at the reference date", () => {
    const rows = buildFloodRows("as-barpeta", series(() => 0, () => 100), REF);
    expect(rows).toHaveLength(HORIZON_DAYS);
    expect(rows[0]!.valid_for).toBe(REF);
    expect(rows.at(-1)!.valid_for).toBe("2022-06-20");
  });

  it("sums rolling rainfall windows ending on the day", () => {
    const f = floodFeatures(series(() => 10, () => 100), REF, 100);
    expect(f).toMatchObject({ rain_1d_mm: 10, rain_3d_mm: 30, rain_7d_mm: 70 });
  });

  it("compares discharge to the pre-reference baseline", () => {
    const s = series(() => 0, (d) => (d < REF ? 100 : 250));
    const [first] = buildFloodRows("as-barpeta", s, REF);
    expect(first!.features.discharge_ratio).toBe(2.5);
  });

  it("falls back to a neutral ratio when discharge is missing or the baseline is negligible", () => {
    expect(floodFeatures(series(() => 0, () => null), REF, 100).discharge_ratio).toBe(1);
    expect(floodFeatures(series(() => 0, () => 5), REF, 0.2).discharge_ratio).toBe(1);
  });

  it("decays the antecedent precipitation index day by day", () => {
    // 10 mm only on the reference date, then dry: API = 10, 9, 8.1, ...
    const s = series((d) => (d === REF ? 10 : 0), () => 100);
    expect(apiIndex(s, REF)).toBe(10);
    expect(apiIndex(s, "2022-06-16")).toBeCloseTo(10 * API_DECAY ** 2);
  });

  it("passes the extra XGBoost inputs through, including the region point", () => {
    const [first] = buildFloodRows("as-barpeta", series(() => 10, () => 100), REF, { lat: 26.3, lon: 91 });
    expect(first!.features).toMatchObject({ rain_hours_1d: 4, temp_min_c: 22, temp_mean_c: 26, lat: 26.3, lon: 91 });
  });
});
