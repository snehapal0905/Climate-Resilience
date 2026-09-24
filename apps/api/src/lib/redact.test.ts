import { describe, expect, it } from "vitest";
import { redactLocation } from "./redact.js";

describe("redactLocation", () => {
  it("removes coordinates from logged location lookups", () => {
    const out = redactLocation({ method: "GET", url: "/api/regions/locate?lat=26.1445&lon=91.7362", query: { lat: "26.1445", lon: "91.7362" } });
    expect(out.url).toBe("/api/regions/locate?[redacted]");
    expect(out).not.toHaveProperty("query");
    expect(JSON.stringify(out)).not.toMatch(/26\.14|91\.73/);
  });

  it("leaves other requests untouched", () => {
    const req = { method: "GET", url: "/api/risk/map?run=1&date=2022-06-16", query: { run: "1" } };
    expect(redactLocation(req)).toEqual(req);
  });
});
