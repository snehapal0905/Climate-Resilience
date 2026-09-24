import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Hazard, RunSummary } from "@climate/shared";
import { formatDay } from "../lib/format";
import { normalizeName, type GeoIndex } from "./geo";
import { HazardStatusBadge, HazardTile } from "../hazards/HazardBits";
import { HAZARD_REGISTRY } from "../hazards/registry";

const selectClass =
  "w-full appearance-none rounded-lg border border-lp-line-strong bg-lp-surface py-2.5 pl-3 pr-9 text-[14.5px] text-lp-ink transition-colors hover:border-lp-ink-3 focus:border-lp-green focus:outline-none disabled:text-lp-ink-3";

function Chevron() {
  return (
    <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lp-ink-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-none">
      <label htmlFor={id} className="text-[12px] font-medium uppercase tracking-[0.12em] text-lp-ink-3">
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}

interface HazardPickerProps {
  value: Hazard;
  onChange: (hazard: Hazard) => void;
}

/**
 * Hazard selector as a radio group of chips (wraps on desktop, scrolls sideways on phones).
 * Coming-soon hazards stay selectable so people can see what's planned; they never show data.
 */
export function HazardPicker({ value, onChange }: HazardPickerProps) {
  const labelId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const index = HAZARD_REGISTRY.findIndex((h) => h.id === value);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + HAZARD_REGISTRY.length) % HAZARD_REGISTRY.length;
    onChange(HAZARD_REGISTRY[next]!.id);
    refs.current[next]?.focus();
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span id={labelId} className="text-[12px] font-medium uppercase tracking-[0.12em] text-lp-ink-3">
        Hazard
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={onKeyDown}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
      >
        {HAZARD_REGISTRY.map((h, i) => {
          const selected = h.id === value;
          return (
            <button
              key={h.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(h.id)}
              title={h.status === "active" ? h.description : `${h.name}: coming soon`}
              className={`flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-green ${
                selected ? "border-lp-green bg-lp-green-soft text-lp-ink" : "border-lp-line bg-lp-surface text-lp-ink-2 hover:border-lp-ink-3"
              }`}
            >
              <HazardTile hazard={h.id} size="sm" />
              <span className={selected ? "font-medium" : ""}>{h.name}</span>
              <HazardStatusBadge status={h.status} compact />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Today's calendar date in India, to label the live run's first day. */
function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

interface DateSelectProps {
  /** Set when the selected hazard has no model, so there are no forecast dates to choose. */
  notApplicable?: boolean;
  runs: RunSummary[] | undefined;
  loading: boolean;
  runId?: number;
  date?: string;
  onChange: (runId: number, date: string) => void;
}

export function DateSelect({ notApplicable = false, runs, loading, runId, date, onChange }: DateSelectProps) {
  const id = useId();
  const today = todayInIndia();
  if (notApplicable) {
    return (
      <Field label="Date" id={id}>
        <select id={id} className={`${selectClass} sm:w-64`} disabled value="">
          <option value="">Not available for this hazard</option>
        </select>
        <Chevron />
      </Field>
    );
  }
  const unavailable = !loading && (!runs || runs.length === 0);
  return (
    <Field label="Date" id={id}>
      <select
        id={id}
        className={`${selectClass} sm:w-64`}
        disabled={loading || unavailable}
        value={runId && date ? `${runId}|${date}` : ""}
        onChange={(e) => {
          const [r, d] = e.target.value.split("|");
          onChange(Number(r), d!);
        }}
      >
        {loading && <option value="">Loading forecasts…</option>}
        {unavailable && <option value="">No forecasts available</option>}
        {runs?.map((run) => (
          <optgroup key={run.id} label={run.mode === "live" ? "Live forecast" : run.label}>
            {run.valid_dates.map((d) => (
              <option key={d} value={`${run.id}|${d}`}>
                {run.mode === "live"
                  ? `${d === today ? "Today · " : ""}${formatDay(d)}`
                  : formatDay(d, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <Chevron />
    </Field>
  );
}

export interface SearchHit {
  kind: "state" | "district";
  state: string;
  district?: string;
  name: string;
  context: string;
}

export function LocationSearch({ index, onSelect }: { index: GeoIndex | undefined; onSelect: (hit: SearchHit) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const stateNames = useMemo(() => new Map(index?.states.map((s) => [s.slug, s.name])), [index]);

  const hits = useMemo<SearchHit[]>(() => {
    const q = normalizeName(query);
    if (!index || q.length < 2) return [];
    const scored: Array<[number, SearchHit]> = [];
    for (const s of index.states) {
      const n = normalizeName(s.name);
      if (n.includes(q)) scored.push([n.startsWith(q) ? 0 : 2, { kind: "state", state: s.slug, name: s.name, context: "State" }]);
    }
    for (const d of index.districts) {
      const n = normalizeName(d.name);
      if (n.includes(q)) scored.push([n.startsWith(q) ? 1 : 3, { kind: "district", state: d.state, district: d.slug, name: d.name, context: `District · ${stateNames.get(d.state) ?? ""}` }]);
    }
    return scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name)).slice(0, 8).map(([, h]) => h);
  }, [index, query, stateNames]);

  const showNoResults = open && normalizeName(query).length >= 2 && hits.length === 0;

  const choose = (hit: SearchHit) => {
    onSelect(hit);
    setQuery(hit.name);
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = hits[active];
      if (hit) choose(hit);
      else setOpen(true);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full sm:max-w-md">
      <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lp-ink-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.5" />
        <path d="m10.6 10.6 3.4 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open && (hits.length > 0 || showNoResults)}
        aria-controls={listId}
        aria-activedescendant={open && hits[active] ? `${listId}-${active}` : undefined}
        aria-autocomplete="list"
        aria-label="Search a state or district"
        placeholder={index ? "Search a state or district…" : "Loading places…"}
        disabled={!index}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-lp-line-strong bg-lp-surface py-2.5 pl-10 pr-3 text-[15px] text-lp-ink placeholder:text-lp-ink-3 hover:border-lp-ink-3 focus:border-lp-green focus:outline-none"
      />
      {open && (hits.length > 0 || showNoResults) && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-lg border border-lp-line bg-lp-surface py-1 shadow-[0_16px_40px_-20px_rgb(22_32_27/0.35)]">
          {hits.map((h, i) => (
            <li
              key={`${h.kind}-${h.state}-${h.district ?? ""}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(h)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline justify-between gap-3 px-3.5 py-2.5 text-[14.5px] ${i === active ? "bg-lp-green-soft" : ""}`}
            >
              <span className="text-lp-ink">{h.name}</span>
              <span className="shrink-0 text-[12.5px] text-lp-ink-3">{h.context}</span>
            </li>
          ))}
          {showNoResults && (
            <li className="px-3.5 py-2.5 text-[14px] text-lp-ink-3" role="status">
              No location found.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export interface Crumb {
  label: string;
  onClick?: () => void;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-1.5 text-[14px]">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${c.label}`} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-lp-line-strong" aria-hidden="true">
                  /
                </span>
              )}
              <button
                type="button"
                onClick={c.onClick}
                aria-current={last ? "location" : undefined}
                className={`rounded underline-offset-4 hover:underline ${last ? "font-medium text-lp-ink" : "text-lp-green"}`}
              >
                {c.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
