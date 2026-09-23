import { describe, expect, it } from "vitest";
import { dateRange } from "../lib/dates.js";
import { buildFloodRows, floodFeatures, HORIZON_DAYS, requiredWindow } from "./features.js";
import type { WeatherSeries } from "./openMeteo.js";

const REF = "2022-06-14";

function series(rain: (date: string) => number, discharge: (date: string) => number | null): WeatherSeries {
  const { start, end } = requiredWindow(REF);
  return new Map(
    dateRange(start, end).map((d) => [
      d,
      { precipitation_mm: rain(d), temperature_max_c: 30, river_discharge_m3s: discharge(d) },
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
});
