import type { ReactNode } from "react";
import { FEATURE_LABELS, NO_DATA_COLOR, RISK_LEVEL_META, RISK_LEVELS, type RiskLevel, type RunSummary } from "@climate/shared";
import { RiskIcon } from "../components/RiskBadge";
import { HazardStatusBadge, HazardTile } from "../hazards/HazardBits";
import type { HazardMeta } from "../hazards/registry";
import { useRegion } from "../lib/api";
import { formatDay } from "../lib/format";
import { Link } from "../lib/router";
import type { DistrictEntry, StateEntry } from "./geo";

/** A model region (district with predictions) as used by the Explore page. */
export interface RiskRegion {
  id: string;
  name: string;
  state_slug: string;
  district_slug: string;
  risk_level: RiskLevel | null;
  risk_score: number | null;
}

export type RiskStatus = "loading" | "error" | "ready";

export type LevelCounts = Record<RiskLevel | "none", number>;

export function countLevels(regions: RiskRegion[], totalDistricts: number): LevelCounts {
  const counts: LevelCounts = { severe: 0, high: 0, moderate: 0, low: 0, none: 0 };
  for (const r of regions) counts[r.risk_level ?? "none"] += 1;
  // Districts in the boundary data that the model doesn't cover count as "no data".
  counts.none += Math.max(0, totalDistricts - regions.length);
  return counts;
}

const LEVELS_DESC = [...RISK_LEVELS].reverse();
const pct = (score: number) => `${Math.round(score * 100)}%`;
const longDay = (d: string) => formatDay(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header>
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-lp-ink-3">{eyebrow}</p>
      <h2 className="mt-1.5 font-lp-display text-[30px] leading-tight text-lp-ink">{title}</h2>
      {children && <div className="mt-2 text-[14.5px] leading-relaxed text-lp-ink-2">{children}</div>}
    </header>
  );
}

export function LevelBadge({ level }: { level: RiskLevel | null }) {
  if (!level)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-lp-line-strong px-2.5 py-0.5 text-[13px] font-medium text-lp-ink-2">
        <span className="lp-hatch-swatch h-2.5 w-2.5 rounded-sm" aria-hidden="true" />
        No data
      </span>
    );
  const { color, label } = RISK_LEVEL_META[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[13px] font-semibold text-lp-ink"
      style={{ borderColor: color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <span style={{ color }}>
        <RiskIcon level={level} className="h-3.5 w-3.5" />
      </span>
      {label}
    </span>
  );
}

function CountRows({ counts }: { counts: LevelCounts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const rows: Array<{ key: RiskLevel | "none"; label: string; color: string }> = [
    ...LEVELS_DESC.map((l) => ({ key: l, label: RISK_LEVEL_META[l].label, color: RISK_LEVEL_META[l].color })),
    { key: "none", label: "No data", color: NO_DATA_COLOR },
  ];
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 text-[14px]">
          <span className="flex items-center gap-2 text-lp-ink-2">
            {r.key === "none" ? (
              <span className="lp-hatch-swatch h-3 w-3 rounded-sm border border-lp-line-strong" aria-hidden="true" />
            ) : (
              <span style={{ color: r.color }}>
                <RiskIcon level={r.key} className="h-4 w-4" />
              </span>
            )}
            {r.label}
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-lp-line/70" aria-hidden="true">
            <span
              className={`block h-full rounded-full ${r.key === "none" ? "lp-hatch-swatch" : ""}`}
              style={{ width: `${(counts[r.key] / total) * 100}%`, background: r.key === "none" ? undefined : r.color }}
            />
          </span>
          <span className="text-right font-medium tabular-nums text-lp-ink">{counts[r.key]}</span>
        </li>
      ))}
    </ul>
  );
}

function Notice({ tone = "neutral", children }: { tone?: "neutral" | "warning"; children: ReactNode }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-[14px] leading-relaxed ${tone === "warning" ? "border-[#ec835a]/40 bg-[#ec835a]/8 text-lp-ink" : "border-lp-line bg-lp-bg text-lp-ink-2"}`}>
      {children}
    </div>
  );
}

function RiskUnavailable() {
  return <Notice tone="warning">Risk data unavailable. The forecast service couldn't be reached, so no region can show risk right now.</Notice>;
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-lp-line/60" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

export interface CoverageRow {
  state: StateEntry;
  regions: number;
  counts: LevelCounts;
}

export function IndiaPanel({ hazard, coverage, status, date, onOpenState }: { hazard: HazardMeta; coverage: CoverageRow[]; status: RiskStatus; date?: string; onOpenState: (slug: string) => void }) {
  const noun = hazard.name.toLowerCase();
  return (
    <div className="space-y-6">
      <Heading eyebrow="Overview" title="India">
        Select a state to explore regional climate risk.
      </Heading>

      <section>
        <h3 className="mb-3 text-[13px] font-medium text-lp-ink-2">{hazard.name} forecasts available{date ? ` · ${longDay(date)}` : ""}</h3>
        {status === "loading" && <Skeleton rows={1} />}
        {status === "error" && <RiskUnavailable />}
        {status === "ready" && coverage.length === 0 && <Notice>No {noun} predictions are available for this date.</Notice>}
        {status === "ready" && coverage.length > 0 && (
          <ul className="space-y-2">
            {coverage.map((c) => {
              const elevated = c.counts.severe + c.counts.high;
              return (
                <li key={c.state.slug}>
                  <button
                    type="button"
                    onClick={() => onOpenState(c.state.slug)}
                    className="group flex w-full items-center justify-between gap-3 rounded-lg border border-lp-line bg-lp-surface px-4 py-3 text-left transition hover:border-lp-green/40"
                  >
                    <span>
                      <span className="block text-[15px] font-semibold text-lp-ink">{c.state.name}</span>
                      <span className="block text-[13px] text-lp-ink-3">
                        {c.regions} districts · {elevated > 0 ? `${elevated} at high or severe risk` : "no district at high or severe risk"}
                      </span>
                    </span>
                    <svg className="h-4 w-4 shrink-0 text-lp-green transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Notice>
        <span className="font-medium text-lp-ink">Other states:</span> no {noun} prediction data available yet. They're shown in hatched grey, which means
        <em> no data</em>, not low risk.
      </Notice>
    </div>
  );
}

export function StatePanel({
  hazard,
  state,
  hasData,
  regions,
  totalDistricts,
  status,
  run,
  date,
  onSelectDistrict,
}: {
  hazard: HazardMeta;
  state: StateEntry;
  hasData: boolean;
  regions: RiskRegion[];
  totalDistricts: number;
  status: RiskStatus;
  run: RunSummary | null;
  date?: string;
  onSelectDistrict: (slug: string) => void;
}) {
  if (status === "loading") {
    return (
      <div className="space-y-6">
        <Heading eyebrow="State" title={state.name} />
        <Skeleton />
      </div>
    );
  }
  if (!hasData) {
    return (
      <div className="space-y-6">
        <Heading eyebrow="State" title={state.name} />
        {status === "error" ? (
          <RiskUnavailable />
        ) : (
          <Notice>
            No {hazard.name.toLowerCase()} prediction data available yet. District boundaries are shown ({totalDistricts} districts), but there is no current{" "}
            {hazard.name.toLowerCase()} prediction for this state.
          </Notice>
        )}
        <p className="text-[14px] text-lp-ink-3">Select a district on the map to view it.</p>
      </div>
    );
  }

  const counts = countLevels(regions, totalDistricts);
  const top = [...regions].filter((r) => r.risk_score != null).sort((a, b) => b.risk_score! - a.risk_score!).slice(0, 5);
  return (
    <div className="space-y-6">
      <Heading eyebrow="State" title={state.name}>
        {hazard.name} risk overview{date ? ` · ${longDay(date)}` : ""}
      </Heading>
      <CountRows counts={counts} />
      <section>
        <h3 className="mb-2 text-[13px] font-medium text-lp-ink-2">Highest-risk districts</h3>
        <ol className="divide-y divide-lp-line overflow-hidden rounded-lg border border-lp-line bg-lp-surface">
          {top.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelectDistrict(r.district_slug)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-lp-bg"
              >
                <span className="text-[14.5px] font-medium text-lp-ink">{r.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[13px] tabular-nums text-lp-ink-3">{pct(r.risk_score!)}</span>
                  <LevelBadge level={r.risk_level} />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
      {run && hazard.dashboardPath && (
        <Link
          to={`${hazard.dashboardPath}?run=${run.id}${date ? `&date=${date}` : ""}`}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-lp-green underline-offset-4 hover:underline"
        >
          Open the full {hazard.name.toLowerCase()} dashboard →
        </Link>
      )}
    </div>
  );
}

function Outlook({ points, selected, onSelect }: { points: Array<{ valid_for: string; risk_level: RiskLevel; risk_score: number }>; selected?: string; onSelect: (d: string) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {points.map((p) => {
        const color = RISK_LEVEL_META[p.risk_level].color;
        const active = p.valid_for === selected;
        return (
          <button
            key={p.valid_for}
            type="button"
            onClick={() => onSelect(p.valid_for)}
            aria-pressed={active}
            aria-label={`${formatDay(p.valid_for)}: ${RISK_LEVEL_META[p.risk_level].label}, ${pct(p.risk_score)}`}
            title={`${formatDay(p.valid_for)} · ${RISK_LEVEL_META[p.risk_level].label} · ${pct(p.risk_score)}`}
            className={`flex flex-col items-center gap-1.5 rounded-md py-1.5 transition-colors ${active ? "bg-lp-green-soft" : "hover:bg-lp-bg"}`}
          >
            <span className="flex h-16 w-full items-end justify-center">
              <span className="w-3/5 rounded-t-[4px]" style={{ height: `${Math.max(6, p.risk_score * 100)}%`, background: color }} />
            </span>
            <span className={`text-[11.5px] ${active ? "font-semibold text-lp-ink" : "text-lp-ink-3"}`}>{formatDay(p.valid_for, { weekday: "short" })}</span>
          </button>
        );
      })}
    </div>
  );
}

export function DistrictPanel({
  hazard,
  state,
  district,
  region,
  run,
  date,
  onSelectDate,
}: {
  hazard: HazardMeta;
  state: StateEntry;
  district: DistrictEntry | { name: string; slug: string };
  region: RiskRegion | undefined;
  run: RunSummary | null;
  date?: string;
  onSelectDate: (d: string) => void;
}) {
  const detail = useRegion(region?.id, run?.id);

  if (!region) {
    return (
      <div className="space-y-6">
        <Heading eyebrow={`District · ${state.name}`} title={district.name} />
        <LevelBadge level={null} />
        <Notice>No {hazard.name.toLowerCase()} prediction data available yet for this district.</Notice>
      </div>
    );
  }

  const timeline = detail.data?.risk_timeline ?? [];
  const point = timeline.find((p) => p.valid_for === date) ?? timeline[0];
  const level = point?.risk_level ?? region.risk_level;
  const score = point?.risk_score ?? region.risk_score;
  const maxImpact = Math.max(0.0001, ...(point?.top_factors.map((f) => f.impact) ?? []));
  const detailHref = hazard.dashboardPath
    ? `${hazard.dashboardPath}?${new URLSearchParams({ ...(run ? { run: String(run.id) } : {}), ...(date ? { date } : {}), region: region.id })}`
    : undefined;

  return (
    <div className="space-y-6">
      <Heading eyebrow={`District · ${state.name}`} title={region.name} />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-lp-line bg-lp-surface p-4">
        <div>
          <p className="text-[12.5px] text-lp-ink-3">{hazard.name} risk{point ? ` · ${formatDay(point.valid_for)}` : ""}</p>
          <p className="mt-1 font-lp-display text-[40px] leading-none tabular-nums text-lp-ink">{score != null ? pct(score) : "—"}</p>
        </div>
        <LevelBadge level={level} />
      </div>

      {detail.isLoading && <Skeleton rows={2} />}
      {detail.isError && <Notice tone="warning">District details couldn't be loaded right now.</Notice>}

      {point && point.top_factors.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-[13px] font-medium text-lp-ink-2">Top contributing factors</h3>
          <ul className="space-y-2.5">
            {point.top_factors.map((f) => (
              <li key={f.feature} className="text-[14px]">
                <div className="mb-1 text-lp-ink">{FEATURE_LABELS[f.feature] ?? f.feature}</div>
                <div className="h-1.5 overflow-hidden rounded-full bg-lp-line/70">
                  <div className="h-full rounded-full bg-lp-green" style={{ width: `${Math.max(3, (f.impact / maxImpact) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {timeline.length > 0 && (
        <section>
          <h3 className="mb-2 text-[13px] font-medium text-lp-ink-2">7-day outlook</h3>
          <Outlook points={timeline} selected={point?.valid_for} onSelect={onSelectDate} />
        </section>
      )}

      {detailHref && (
      <Link
        to={detailHref}
        className="group flex w-full items-center justify-center gap-2 rounded-full bg-lp-green px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-lp-green-deep sm:w-auto sm:inline-flex"
      >
        View detailed forecast
        <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      )}
      {run && <p className="text-[12.5px] text-lp-ink-3">Model: {run.model_version}</p>}
    </div>
  );
}

/** Shown for hazards without a model: explains what is planned and never shows risk values. */
export function ComingSoonPanel({ hazard, place, activeName, onExploreActive }: { hazard: HazardMeta; place?: string; activeName: string; onExploreActive: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <HazardTile hazard={hazard.id} size="lg" />
        <HazardStatusBadge status={hazard.status} />
      </div>
      <Heading eyebrow={place ? `${hazard.name} · ${place}` : hazard.name} title={`${hazard.name} intelligence is coming soon.`}>
        {hazard.comingSoon}
      </Heading>
      <dl className="divide-y divide-lp-line rounded-xl border border-lp-line bg-lp-bg text-[14px]">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-lp-ink-3">Status</dt>
          <dd className="font-medium text-lp-ink">Coming soon</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-lp-ink-3">Data</dt>
          <dd className="font-medium text-lp-ink">{hazard.dataAvailability}</dd>
        </div>
      </dl>
      <p className="text-[13.5px] leading-relaxed text-lp-ink-3">{hazard.description} There is no model for this hazard yet, so the map shows boundaries only.</p>
      <button
        type="button"
        onClick={onExploreActive}
        className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-lp-green underline-offset-4 hover:underline"
      >
        Explore {activeName} Risk →
      </button>
    </div>
  );
}
