/** Presentational pieces shared by /prepare and the hazard guide pages. */
import { useId, useState, type ReactNode } from "react";
import { EMERGENCY_KIT, PREPAREDNESS_DISCLAIMER, type OfficialSource } from "./content";

export type Stage = "before" | "during" | "after";

/** Stage hues carry meaning alongside a text label and number, never on their own. */
export const STAGES: ReadonlyArray<{ id: Stage; label: string; hint: string; color: string }> = [
  { id: "before", label: "Before", hint: "Get ready", color: "#1f5a41" },
  { id: "during", label: "During", hint: "Stay safe", color: "#8a5a12" },
  { id: "after", label: "After", hint: "Recover safely", color: "#2f5475" },
];

export function ArrowIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Faint topographic contour lines, used as a quiet geospatial backdrop. */
export function ContourMotif({ className = "" }: { className?: string }) {
  return (
    <svg className={`pointer-events-none ${className}`} viewBox="0 0 400 300" fill="none" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path
          key={i}
          d={`M${-20 + i * 6} ${250 - i * 26}c60 ${-30 + i * 3} 90 ${40 - i * 4} 150 ${10 - i * 2}s110 ${-60 + i * 5} 160 ${-40 + i * 3} 80 30 ${130 - i * 6} 20`}
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.9 - i * 0.1}
        />
      ))}
      <circle cx="262" cy="118" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="262" cy="118" r="9" stroke="currentColor" opacity="0.35" />
    </svg>
  );
}

export function SectionTitle({ id, eyebrow, title, children }: { id?: string; eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-lp-green">{eyebrow}</p>}
      <h2 id={id} className="font-lp-display text-[28px] leading-[1.12] tracking-[-0.015em] text-lp-ink sm:text-[36px]">
        {title}
      </h2>
      {children && <p className="mt-3 text-[16px] leading-relaxed text-lp-ink-2">{children}</p>}
    </div>
  );
}

/**
 * A tickable checklist. Ticks live only in memory for this visit: nothing is saved or sent.
 * Each item is a full-width label, so the whole row is a comfortable tap target.
 */
export function Checklist({ items, color, label }: { items: readonly string[]; color: string; label: string }) {
  const baseId = useId();
  const [done, setDone] = useState<ReadonlySet<number>>(new Set());
  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div>
      <ul className="space-y-1" aria-label={label}>
        {items.map((text, i) => {
          const id = `${baseId}-${i}`;
          const checked = done.has(i);
          return (
            <li key={text}>
              <label
                htmlFor={id}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-lp-bg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-lp-green"
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(i)}
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded focus-visible:outline-none"
                  style={{ accentColor: color }}
                />
                <span className={`text-[15px] leading-snug ${checked ? "text-lp-ink-3 line-through decoration-lp-ink-3/50" : "text-lp-ink"}`}>{text}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 px-2.5 text-[12.5px] text-lp-ink-3" aria-live="polite">
        {done.size} of {items.length} done
      </p>
    </div>
  );
}

/** Before / During / After: three columns on large screens, stacked on mobile. */
export function StageChecklists({ guide }: { guide: Record<Stage, readonly string[]> }) {
  return (
    <ol className="grid gap-4 lg:grid-cols-3">
      {STAGES.map((s, i) => (
        <li key={s.id} id={`stage-${s.id}`} className="scroll-mt-24 overflow-hidden rounded-xl border border-lp-line bg-lp-surface">
          <div className="h-1" style={{ background: s.color }} aria-hidden="true" />
          <div className="px-4 pb-4 pt-5 sm:px-5">
            <div className="flex items-baseline gap-3 px-2.5">
              <span className="font-lp-display text-[15px]" style={{ color: s.color }} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-[20px] font-semibold tracking-tight text-lp-ink">{s.label}</h3>
              <span className="text-[13.5px] text-lp-ink-3">{s.hint}</span>
            </div>
            <div className="mt-3">
              <Checklist items={guide[s.id]} color={s.color} label={`${s.label}: checklist`} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

const DONT = { ink: "#98301f", soft: "#fbf0ec", line: "#efd3ca" };

export function WarningIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3 18 16.5H2L10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8.2v3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.2" r=".9" fill="currentColor" />
    </svg>
  );
}

export function DoNotList({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {items.map((text) => (
        <li key={text} className="flex items-start gap-3 rounded-lg border px-4 py-3" style={{ borderColor: DONT.line, background: DONT.soft }}>
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: DONT.ink }} aria-hidden="true">
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="m3 3 6 6M9 3 3 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-[15px] leading-snug text-lp-ink">{text}</span>
        </li>
      ))}
    </ul>
  );
}

export const DO_NOT_INK = DONT.ink;

/** The general emergency kit, plus optional hazard-specific additions. */
export function EmergencyKit({ extras = [], hazardName }: { extras?: readonly string[]; hazardName?: string }) {
  return (
    <div className="rounded-2xl border border-lp-line bg-lp-surface p-5 sm:p-7">
      <ul className="grid gap-x-8 gap-y-1 md:grid-cols-2">
        {EMERGENCY_KIT.map((item) => (
          <li key={item.name} className="flex gap-3 border-b border-lp-line py-3 last:border-b-0 md:[&:nth-last-child(2)]:border-b-0">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-lp-green" aria-hidden="true" />
            <span>
              <span className="block text-[15px] font-medium text-lp-ink">{item.name}</span>
              <span className="block text-[14px] leading-snug text-lp-ink-2">{item.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      {extras.length > 0 && (
        <div className="mt-5 rounded-xl bg-lp-green-soft px-4 py-4 sm:px-5">
          <p className="text-[13.5px] font-medium text-lp-green">{hazardName ? `Also useful for ${hazardName.toLowerCase()}` : "Also useful"}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {extras.map((x) => (
              <li key={x} className="rounded-full border border-lp-green/20 bg-lp-surface px-3 py-1 text-[14px] text-lp-ink">
                {x}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Official sources. Without verified links we say so rather than inventing a URL. */
export function OfficialGuidance({ sources }: { sources: readonly OfficialSource[] }) {
  return (
    <div className="rounded-xl border border-dashed border-lp-line-strong bg-lp-surface p-5 sm:p-6">
      <h3 className="text-[16px] font-semibold text-lp-ink">Official guidance</h3>
      {sources.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[15px] font-medium text-lp-green underline-offset-4 hover:underline">
                {s.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <span className="block text-[13px] text-lp-ink-3">{s.publisher}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[14.5px] leading-relaxed text-lp-ink-2">
          Official guidance links will be added here. Until then, follow advisories from your local authorities and emergency services.
        </p>
      )}
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="flex items-start gap-2.5 rounded-lg bg-lp-sand/60 px-4 py-3 text-[13.5px] leading-relaxed text-lp-ink-2">
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-lp-ink-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="5" r=".8" fill="currentColor" />
      </svg>
      <span>{PREPAREDNESS_DISCLAIMER}</span>
    </p>
  );
}
