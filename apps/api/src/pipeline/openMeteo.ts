/**
 * Open-Meteo client (free, no API key).
 *  - Live runs:   forecast API (recent past + 7-day forecast)
 *  - Replay runs: historical archive API (ERA5-based)
 *  - Both:        flood API for GloFAS river discharge (reanalysis back to 1984 + forecast)
 * Many coordinates are fetched per request to stay well within the free-tier limits.
 */
import type { RunMode } from "@climate/shared";
import { logger } from "../logger.js";

export interface Point {
  lat: number;
  lon: number;
}

export interface DayWeather {
  precipitation_mm: number | null;
  temperature_max_c: number | null;
  river_discharge_m3s: number | null;
}

/** One map per input point: ISO date → weather for that day */
export type WeatherSeries = Map<string, DayWeather>;

const WEATHER_URL: Record<RunMode, string> = {
  live: "https://api.open-meteo.com/v1/forecast",
  replay: "https://archive-api.open-meteo.com/v1/archive",
};
const FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood";
const CHUNK_SIZE = 25;

interface DailyResponse {
  daily?: { time: string[]; [variable: string]: (number | null)[] | string[] };
}

async function getJson(url: string, attempt = 1): Promise<unknown> {
  const res = await fetch(url);
  if (res.ok) return res.json();
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    const waitMs = 1000 * 2 ** attempt;
    logger.warn({ status: res.status, waitMs }, "Open-Meteo request failed, retrying");
    await new Promise((r) => setTimeout(r, waitMs));
    return getJson(url, attempt + 1);
  }
  throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
}

/** Fetches daily variables for many points; returns one { date → values } record per point. */
async function fetchDaily(
  baseUrl: string,
  points: Point[],
  variables: string[],
  start: string,
  end: string,
): Promise<Array<Map<string, Record<string, number | null>>>> {
  const out: Array<Map<string, Record<string, number | null>>> = [];
  for (let i = 0; i < points.length; i += CHUNK_SIZE) {
    const chunk = points.slice(i, i + CHUNK_SIZE);
    const params = new URLSearchParams({
      latitude: chunk.map((p) => p.lat.toFixed(4)).join(","),
      longitude: chunk.map((p) => p.lon.toFixed(4)).join(","),
      daily: variables.join(","),
      start_date: start,
      end_date: end,
      timezone: "Asia/Kolkata",
    });
    const json = await getJson(`${baseUrl}?${params}`);
    // A single-location request returns an object, a multi-location one an array.
    const responses = (Array.isArray(json) ? json : [json]) as DailyResponse[];
    for (const r of responses) {
      const byDate = new Map<string, Record<string, number | null>>();
      const times = (r.daily?.time ?? []) as string[];
      times.forEach((date, idx) => {
        const values: Record<string, number | null> = {};
        for (const v of variables) values[v] = (r.daily?.[v] as (number | null)[] | undefined)?.[idx] ?? null;
        byDate.set(date, values);
      });
      out.push(byDate);
    }
  }
  return out;
}

export async function fetchWeather(
  mode: RunMode,
  points: Point[],
  start: string,
  end: string,
): Promise<WeatherSeries[]> {
  const [weather, flood] = await Promise.all([
    fetchDaily(WEATHER_URL[mode], points, ["precipitation_sum", "temperature_2m_max"], start, end),
    fetchDaily(FLOOD_URL, points, ["river_discharge"], start, end),
  ]);

  return points.map((_, i) => {
    const series: WeatherSeries = new Map();
    const w = weather[i] ?? new Map();
    const f = flood[i] ?? new Map();
    for (const date of new Set([...w.keys(), ...f.keys()])) {
      series.set(date, {
        precipitation_mm: w.get(date)?.precipitation_sum ?? null,
        temperature_max_c: w.get(date)?.temperature_2m_max ?? null,
        river_discharge_m3s: f.get(date)?.river_discharge ?? null,
      });
    }
    return series;
  });
}
