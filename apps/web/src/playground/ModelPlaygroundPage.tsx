/**
 * /model-playground: try the flood model on any place in India and any day, then change the rainfall
 * inputs to see how the prediction responds. Runs on demand through POST /api/playground; nothing
 * is stored.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { FEATURE_LABELS, RISK_LEVEL_META, type FloodFeatures, type PlaygroundResponse } from "@climate/shared";
import { LevelBadge } from "../explore/ExplorePanels";
import { runPlayground, type PlaygroundRequest } from "../lib/api";
import { formatDay, formatNumber } from "../lib/format";

interface Place {
  name: string;
  lat: number;
  lon: number;
}

const PLACES: Place[] = [
  { name: "Mumbai", lat: 19.076, lon: 72.8777 },
  { name: "Chennai", lat: 13.0827, lon: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { name: "Patna", lat: 25.5941, lon: 85.1376 },
  { name: "Guwahati", lat: 26.1445, lon: 91.7362 },
  { name: "Delhi", lat: 28.6139, lon: 77.209 },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Hyderabad", lat: 17.385, lon: 78.4867 },
  { name: "Kochi", lat: 9.9312, lon: 76.2673 },
  { name: "Silchar", lat: 24.8333, lon: 92.7789 },
  { name: "Dibrugarh", lat: 27.4728, lon: 94.912 },
];
const CUSTOM = "custom";

/** Known flood days, to check the model against what actually happened. */
const EXAMPLES: Array<{ label: string; place: string; date: string }> = [
  { label: "Mumbai floods", place: "Mumbai", date: "2005-07-26" },
  { label: "Chennai floods", place: "Chennai", date: "2015-12-01" },
  { label: "Kerala floods", place: "Kochi", date: "2018-08-16" },
  { label: "Patna floods", place: "Patna", date: "2019-09-29" },
  { label: "Assam floods", place: "Guwahati", date: "2022-06-17" },
  { label: "Dry winter day", place: "Delhi", date: "2024-01-15" },
];

type OverrideKey = keyof NonNullable<PlaygroundRequest["overrides"]>;
const SLIDERS: Array<{ key: OverrideKey; max: number; unit: string }> = [
  { key: "rain_1d_mm", max: 300, unit: "mm" },
  { key: "rain_3d_mm", max: 600, unit: "mm" },
  { key: "rain_7d_mm", max: 1000, unit: "mm" },
  { key: "api_index", max: 800, unit: "" },
];

/** Latest selectable day: two weeks of forecast (matches the API's limit). */
const maxDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
};
const pct = (score: number) => `${Math.round(score * 100)}%`;

function Card({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-lp-line bg-lp-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-lp-display text-[24px] leading-tight text-lp-ink sm:text-[28px]">{title}</h2>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const fieldClass =
  "w-full rounded-xl border border-lp-line-strong bg-lp-surface px-3.5 py-2.5 text-[15px] text-lp-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lp-green";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function ModelPlaygroundPage() {
  const [placeName, setPlaceName] = useState("Guwahati");
  const [custom, setCustom] = useState({ lat: "26.1445", lon: "91.7362" });
  const [date, setDate] = useState("2022-06-17");
  const [submitted, setSubmitted] = useState<PlaygroundRequest | null>(null);
  const [overrides, setOverrides] = useState<NonNullable<PlaygroundRequest["overrides"]>>({});
  const debouncedOverrides = useDebounced(overrides, 350);

  const preset = PLACES.find((p) => p.name === placeName);
  const lat = preset ? preset.lat : Number(custom.lat);
  const lon = preset ? preset.lon : Number(custom.lon);
  const coordsValid = Number.isFinite(lat) && Number.isFinite(lon) && custom.lat !== "" && custom.lon !== "";

  const request = submitted && { ...submitted, overrides: debouncedOverrides };
  const result = useQuery({
    queryKey: ["playground", request],
    queryFn: () => runPlayground(request!),
    enabled: !!request,
    placeholderData: keepPreviousData,
    retry: false,
  });

  const run = (next: PlaygroundRequest) => {
    setOverrides({});
    setSubmitted(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-lp-green">Model playground</p>
        <h1 className="font-lp-display text-[38px] leading-[1.06] tracking-[-0.02em] text-lp-ink sm:text-[52px]">Test the flood model anywhere in India.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-lp-ink-2">
          Pick a place and a day. We fetch that day's real weather, run the AI flood model and show what it predicts and why. Then change the rainfall to see
          how the prediction responds.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="1. Place and day">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (coordsValid && date) run({ lat, lon, date });
              }}
            >
              <label className="block">
                <span className="mb-1.5 block text-[13.5px] font-medium text-lp-ink-2">Place</span>
                <select className={fieldClass} value={placeName} onChange={(e) => setPlaceName(e.target.value)}>
                  {PLACES.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  <option value={CUSTOM}>Custom coordinates…</option>
                </select>
              </label>
              {!preset && (
                <div className="grid grid-cols-2 gap-3">
                  {(["lat", "lon"] as const).map((k) => (
                    <label key={k} className="block">
                      <span className="mb-1.5 block text-[13.5px] font-medium text-lp-ink-2">{k === "lat" ? "Latitude" : "Longitude"}</span>
                      <input
                        className={fieldClass}
                        inputMode="decimal"
                        value={custom[k]}
                        onChange={(e) => setCustom((c) => ({ ...c, [k]: e.target.value }))}
                      />
                    </label>
                  ))}
                </div>
              )}
              <label className="block">
                <span className="mb-1.5 block text-[13.5px] font-medium text-lp-ink-2">Day</span>
                <input type="date" className={fieldClass} min="1985-01-01" max={maxDate()} value={date} onChange={(e) => setDate(e.target.value)} />
                <span className="mt-1.5 block text-[12.5px] text-lp-ink-3">Any day from 1985 up to two weeks ahead (forecast).</span>
              </label>
              <button
                type="submit"
                disabled={!coordsValid || !date}
                className="inline-flex w-full items-center justify-center rounded-full bg-lp-green px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-lp-green-deep disabled:opacity-50"
              >
                Run the model
              </button>
            </form>
          </Card>

          <Card title="Known flood days">
            <p className="text-[14px] text-lp-ink-2">Check the model against real events.</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <li key={ex.label}>
                  <button
                    type="button"
                    onClick={() => {
                      const p = PLACES.find((x) => x.name === ex.place)!;
                      setPlaceName(p.name);
                      setDate(ex.date);
                      run({ lat: p.lat, lon: p.lon, date: ex.date });
                    }}
                    className="rounded-full border border-lp-line-strong px-3.5 py-1.5 text-[13.5px] text-lp-ink transition-colors hover:border-lp-green hover:bg-lp-green-soft"
                  >
                    {ex.label} <span className="text-lp-ink-3">· {formatDay(ex.date, { day: "numeric", month: "short", year: "numeric" })}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6" aria-live="polite">
          {!submitted ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-lp-line-strong p-8 text-center text-[15px] text-lp-ink-3">
              Choose a place and day, or pick a known flood day, to see the model's prediction.
            </div>
          ) : result.isError ? (
            <div className="rounded-2xl border border-[#ec835a]/40 bg-lp-surface p-6" role="alert">
              <p className="text-[17px] font-medium text-lp-ink">The model couldn't run for this request.</p>
              <p className="mt-2 text-[15px] text-lp-ink-2">{result.error.message}</p>
            </div>
          ) : !result.data ? (
            <div className="h-[320px] animate-pulse rounded-2xl bg-lp-line/60" aria-label="Running the model" />
          ) : (
            <Result data={result.data} placeLabel={preset?.name ?? `${lat.toFixed(3)}, ${lon.toFixed(3)}`} updating={result.isFetching} />
          )}

          {result.data && (
            <Card
              title="2. What if?"
              aside={
                Object.keys(overrides).length > 0 && (
                  <button type="button" onClick={() => setOverrides({})} className="text-[14px] font-medium text-lp-green underline-offset-4 hover:underline">
                    Reset to real weather
                  </button>
                )
              }
            >
              <p className="text-[14.5px] text-lp-ink-2">Move the sliders to change the rainfall the model sees. The prediction above updates automatically.</p>
              <div className="mt-5 space-y-5">
                {SLIDERS.map(({ key, max, unit }) => {
                  const observed = result.data.observed[key] ?? 0;
                  const value = overrides[key] ?? observed;
                  return (
                    <label key={key} className="block">
                      <span className="flex items-baseline justify-between gap-3 text-[14.5px]">
                        <span className="font-medium text-lp-ink">{FEATURE_LABELS[key] ?? key}</span>
                        <span className="tabular-nums text-lp-ink-2">
                          {formatNumber(value, 1)} {unit}
                          {overrides[key] != null && <span className="ml-2 text-[12.5px] text-lp-ink-3">(real: {formatNumber(observed, 1)})</span>}
                        </span>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(max, Math.ceil(observed))}
                        step={1}
                        value={value}
                        onChange={(e) => setOverrides((o) => ({ ...o, [key]: Number(e.target.value) }))}
                        className="mt-2 w-full accent-[var(--lp-green)]"
                      />
                    </label>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

const INPUT_ROWS: Array<{ key: keyof FloodFeatures; unit: string; digits?: number }> = [
  { key: "rain_1d_mm", unit: "mm", digits: 1 },
  { key: "rain_3d_mm", unit: "mm", digits: 1 },
  { key: "rain_7d_mm", unit: "mm", digits: 1 },
  { key: "api_index", unit: "", digits: 1 },
  { key: "river_discharge_m3s", unit: "m³/s", digits: 0 },
  { key: "temp_max_c", unit: "°C", digits: 1 },
  { key: "temp_min_c", unit: "°C", digits: 1 },
];

function Result({ data, placeLabel, updating }: { data: PlaygroundResponse; placeLabel: string; updating: boolean }) {
  const p = data.prediction;
  const maxImpact = Math.max(0.0001, ...p.top_factors.map((f) => f.impact));
  const whatIf = INPUT_ROWS.some(({ key }) => data.features[key] !== data.observed[key]);

  return (
    <div className={`space-y-6 transition-opacity ${updating ? "opacity-60" : ""}`}>
      <section className="rounded-2xl border border-lp-line bg-lp-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold text-lp-ink">Flood risk · {placeLabel}</p>
            <p className="text-[13px] text-lp-ink-3">
              {formatDay(data.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {whatIf ? " · with your “what if” rainfall" : data.source === "forecast" ? " · forecast weather" : " · real weather"}
            </p>
          </div>
          <LevelBadge level={p.risk_level} />
        </div>
        <p className="mt-5 font-lp-display text-[52px] leading-none tabular-nums text-lp-ink">{pct(p.risk_score)}</p>
        <p className="mt-2 text-[13.5px] text-lp-ink-3">
          Risk score from model <span className="font-mono text-[12.5px]">{data.model_version}</span>. {RISK_LEVEL_META[p.risk_level].label} risk.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Why this prediction?">
          {p.top_factors.length === 0 ? (
            <p className="text-[15px] text-lp-ink-2">Nothing in this day's conditions pushed the risk up.</p>
          ) : (
            <ul className="space-y-4">
              {p.top_factors.map((f) => (
                <li key={f.feature}>
                  <div className="text-[15px] font-medium text-lp-ink">{FEATURE_LABELS[f.feature] ?? f.feature}</div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-lp-line/70">
                    <div className="h-full rounded-full bg-lp-green" style={{ width: `${Math.max(3, (f.impact / maxImpact) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="What the model saw">
          <dl className="divide-y divide-lp-line text-[14.5px]">
            {INPUT_ROWS.map(({ key, unit, digits }) => {
              const v = data.features[key];
              const changed = v !== data.observed[key];
              return (
                <div key={key} className="flex justify-between gap-3 py-2">
                  <dt className="text-lp-ink-3">{FEATURE_LABELS[key] ?? key}</dt>
                  <dd className={`tabular-nums ${changed ? "font-semibold text-lp-green" : "text-lp-ink"}`}>
                    {typeof v === "number" ? `${formatNumber(v, digits)} ${unit}` : "—"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Card>
      </div>
    </div>
  );
}
