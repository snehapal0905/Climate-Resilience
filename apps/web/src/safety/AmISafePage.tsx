/**
 * /am-i-safe — location-based risk overview.
 *
 * Privacy: location is requested only after the user clicks, resolved to a district in the browser
 * (resolvePlace.ts), and then discarded. Coordinates are never sent to the server, logged, stored
 * or written to the URL; only the state/district names are kept, in memory.
 */
import { useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { FEATURE_LABELS, RISK_LEVEL_META, type RiskPoint } from "@climate/shared";
import { LevelBadge, Outlook } from "../explore/ExplorePanels";
import { exploreHref } from "../explore/exploreState";
import { HazardStatusBadge, HazardTile } from "../hazards/HazardBits";
import { formatDay } from "../lib/format";
import { Link } from "../lib/router";
import { ROUTES } from "../site/SiteLayout";
import { LocationError, requestCurrentPosition, type LocationErrorKind } from "./geolocation";
import { usePlaceRisk, type HazardAssessment } from "./placeRisk";
import { resolvePlace, type ResolvedPlace } from "./resolvePlace";

const RegionPreviewMap = lazy(() => import("./RegionPreviewMap"));

type Phase = { name: "idle" } | { name: "locating" } | { name: "result"; place: ResolvedPlace } | { name: "error"; kind: LocationErrorKind | "region" };

const ERRORS: Record<LocationErrorKind | "region", { title: string; body: string; retry: boolean }> = {
  denied: { title: "Location access was denied.", body: "Location access is unavailable. You can still explore risk manually.", retry: false },
  unavailable: { title: "We couldn't determine your location.", body: "Your device couldn't provide a location right now. You can try again or explore risk manually.", retry: true },
  timeout: { title: "Location request timed out.", body: "It took too long to get your location. You can try again or explore risk manually.", retry: true },
  unsupported: { title: "Your browser doesn't support location detection.", body: "You can still explore risk manually by choosing a state and district.", retry: false },
  region: { title: "We couldn't identify your region.", body: "Your location doesn't match a district in our India boundary data. You can still explore risk manually.", retry: true },
};

const pct = (score: number) => `${Math.round(score * 100)}%`;
const longDay = (d: string) => formatDay(d, { weekday: "long", day: "numeric", month: "long" });

function ButtonLink({ to, children, primary = false }: { to: string; children: ReactNode; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium transition-colors sm:w-auto ${
        primary ? "bg-lp-green text-white hover:bg-lp-green-deep" : "border border-lp-line-strong bg-lp-surface text-lp-ink hover:border-lp-ink-3"
      }`}
    >
      {children}
    </Link>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-lp-line bg-lp-surface p-5 sm:p-7">
      <h2 className="font-lp-display text-[24px] leading-tight text-lp-ink sm:text-[28px]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function StartView({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-lp-green">Am I Safe?</p>
      <h1 className="font-lp-display text-[38px] leading-[1.06] tracking-[-0.02em] text-lp-ink sm:text-[56px]">Understand the risk around you.</h1>
      <p className="mt-5 text-[17px] leading-relaxed text-lp-ink-2 sm:text-[18px]">
        Use your location to see available climate and disaster risk information for your area.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lp-green px-7 py-4 text-[16px] font-medium text-white transition-colors hover:bg-lp-green-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-green sm:w-auto"
      >
        <span aria-hidden="true">📍</span> Use My Location
      </button>
      <p className="mt-5 flex max-w-lg gap-2.5 text-[13.5px] leading-relaxed text-lp-ink-3">
        <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        Your location is used only to identify your nearby region, and that happens on your device. Your precise coordinates are not sent to our servers or
        stored.
      </p>
      <p className="mt-8 text-[14px] text-lp-ink-3">
        Prefer not to share your location?{" "}
        <Link to={ROUTES.explore} className="font-medium text-lp-green underline-offset-4 hover:underline">
          Explore India manually
        </Link>
      </p>
    </div>
  );
}

function LocatingView() {
  return (
    <div className="flex max-w-2xl flex-col items-start gap-5" role="status" aria-live="polite">
      <span className="relative flex h-12 w-12 items-center justify-center" aria-hidden="true">
        <span className="lp-ping absolute h-full w-full rounded-full bg-lp-green/40" />
        <span className="relative h-4 w-4 rounded-full bg-lp-green" />
      </span>
      <h1 className="font-lp-display text-[32px] leading-tight text-lp-ink sm:text-[44px]">Finding your area...</h1>
      <p className="text-[16px] text-lp-ink-2">Your browser may ask for permission to share your location.</p>
    </div>
  );
}

function ErrorView({ kind, onRetry }: { kind: LocationErrorKind | "region"; onRetry: () => void }) {
  const e = ERRORS[kind];
  return (
    <div className="max-w-2xl" role="alert">
      <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-lp-ink-3">Am I Safe?</p>
      <h1 className="font-lp-display text-[32px] leading-tight text-lp-ink sm:text-[44px]">{e.title}</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-lp-ink-2">{e.body}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink to={ROUTES.explore} primary>
          Explore India
        </ButtonLink>
        {e.retry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex w-full items-center justify-center rounded-full border border-lp-line-strong bg-lp-surface px-6 py-3 text-[15px] font-medium text-lp-ink hover:border-lp-ink-3 sm:w-auto"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function trend(points: RiskPoint[]): string {
  if (points.length < 2) return "Not enough forecast days to show a trend";
  const first = points[0]!;
  const rest = points.slice(1);
  const peak = rest.reduce((a, b) => (b.risk_score > a.risk_score ? b : a));
  const low = rest.reduce((a, b) => (b.risk_score < a.risk_score ? b : a));
  if (peak.risk_score - first.risk_score >= 0.1) return `Rising — highest on ${longDay(peak.valid_for)} (${RISK_LEVEL_META[peak.risk_level].label.toLowerCase()})`;
  if (first.risk_score - low.risk_score >= 0.1) return `Easing over the coming days`;
  return "Steady over the forecast period";
}

function influence(ratio: number) {
  return ratio >= 0.75 ? "Strongest influence" : ratio >= 0.4 ? "Moderate influence" : "Smaller influence";
}

function PrimarySummary({ a, place }: { a: HazardAssessment; place: ResolvedPlace }) {
  const name = a.hazard.name;
  if (a.status === "error") {
    return (
      <div className="rounded-2xl border border-[#ec835a]/40 bg-lp-surface p-5 sm:p-7" role="alert">
        <p className="text-[17px] font-medium text-lp-ink">Risk data is temporarily unavailable.</p>
        <p className="mt-2 text-[15px] text-lp-ink-2">The forecast service couldn't be reached. Please try again later.</p>
        <div className="mt-5">
          <ButtonLink to={ROUTES.explore}>Explore India</ButtonLink>
        </div>
      </div>
    );
  }
  if (a.availability === "no_data") {
    if (a.status === "loading") return <div className="h-36 animate-pulse rounded-2xl bg-lp-line/60" aria-label="Loading risk data" />;
    return (
      <div className="rounded-2xl border border-lp-line bg-lp-surface p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <HazardTile hazard={a.hazard.id} />
          <LevelBadge level={null} />
        </div>
        <p className="mt-4 text-[18px] font-medium leading-snug text-lp-ink">{name} prediction data is not currently available for this region.</p>
        <p className="mt-2 text-[15px] leading-relaxed text-lp-ink-2">ClimateResilience is progressively expanding regional risk coverage.</p>
        <div className="mt-6">
          <ButtonLink to={exploreHref({ hazard: a.hazard.id })}>Explore available regions</ButtonLink>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-lp-line bg-lp-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <HazardTile hazard={a.hazard.id} />
          <div>
            <p className="text-[15px] font-semibold text-lp-ink">{name} risk</p>
            {a.validFor && <p className="text-[13px] text-lp-ink-3">Forecast for {longDay(a.validFor)}</p>}
          </div>
        </div>
        <LevelBadge level={a.level ?? null} />
      </div>
      <p className="mt-5 font-lp-display text-[52px] leading-none tabular-nums text-lp-ink">{a.score != null ? pct(a.score) : "—"}</p>
      <p className="mt-2 text-[13.5px] text-lp-ink-3">Risk score for {place.district.name} district from the current forecast model.</p>
    </div>
  );
}

function HazardCards({ items }: { items: HazardAssessment[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => (
        <li key={a.hazard.id} className="flex items-center justify-between gap-3 rounded-xl border border-lp-line bg-lp-surface px-4 py-3.5">
          <span className="flex items-center gap-3">
            <HazardTile hazard={a.hazard.id} size="sm" />
            <span className="text-[15px] font-medium text-lp-ink">{a.hazard.name}</span>
          </span>
          {a.availability === "coming_soon" ? (
            <HazardStatusBadge status="coming_soon" />
          ) : a.status === "loading" ? (
            <span className="h-5 w-16 animate-pulse rounded-full bg-lp-line/70" aria-label="Loading" />
          ) : a.status === "error" ? (
            <span className="text-[13px] text-lp-ink-3">Unavailable</span>
          ) : (
            <LevelBadge level={a.availability === "data" ? (a.level ?? null) : null} />
          )}
        </li>
      ))}
    </ul>
  );
}

function Explanation({ a, place }: { a: HazardAssessment; place: ResolvedPlace }) {
  const [day, setDay] = useState<string | undefined>(a.validFor);
  const timeline = a.timeline ?? [];
  const today = timeline.find((p) => p.valid_for === a.validFor) ?? timeline[0];
  const selected = timeline.find((p) => p.valid_for === day) ?? today;
  if (!today || !a.level) return null;
  const maxImpact = Math.max(0.0001, ...today.top_factors.map((f) => f.impact));
  const factorNames = today.top_factors.map((f) => (FEATURE_LABELS[f.feature] ?? f.feature).toLowerCase());
  const first = timeline[0]?.valid_for;
  const last = timeline.at(-1)?.valid_for;

  return (
    <>
      <Section title="Why is this risk level?">
        <p className="text-[15px] leading-relaxed text-lp-ink-2">These forecast conditions contributed most to today's {a.hazard.name.toLowerCase()} risk score for your district.</p>
        <ul className="mt-5 space-y-4">
          {today.top_factors.map((f) => (
            <li key={f.feature}>
              <div className="flex items-baseline justify-between gap-3 text-[15px]">
                <span className="font-medium text-lp-ink">{FEATURE_LABELS[f.feature] ?? f.feature}</span>
                <span className="text-[13px] text-lp-ink-3">{influence(f.impact / maxImpact)}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-lp-line/70">
                <div className="h-full rounded-full bg-lp-green" style={{ width: `${Math.max(3, (f.impact / maxImpact) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="What does this mean?">
        <p className="text-[16px] leading-relaxed text-lp-ink">
          Current {a.hazard.name.toLowerCase()} risk is <strong className="font-semibold">{RISK_LEVEL_META[a.level].label.toLowerCase()}</strong> based on the available
          forecast data for {place.district.name} district.
        </p>
        <dl className="mt-5 divide-y divide-lp-line rounded-xl border border-lp-line text-[14.5px]">
          {first && last && (
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr]">
              <dt className="text-lp-ink-3">Forecast period</dt>
              <dd className="text-lp-ink">
                {formatDay(first)} – {formatDay(last)} ({timeline.length} days)
              </dd>
            </div>
          )}
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr]">
            <dt className="text-lp-ink-3">Risk trend</dt>
            <dd className="text-lp-ink">{trend(timeline)}</dd>
          </div>
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr]">
            <dt className="text-lp-ink-3">Main contributing factors</dt>
            <dd className="text-lp-ink first-letter:uppercase">{factorNames.join(", ")}</dd>
          </div>
        </dl>
        {timeline.length > 1 && (
          <div className="mt-6">
            <h3 className="mb-2 text-[13px] font-medium text-lp-ink-2">7-day outlook</h3>
            <Outlook points={timeline} selected={selected?.valid_for} onSelect={setDay} />
            {selected && (
              <p className="mt-2 text-[13.5px] text-lp-ink-3" aria-live="polite">
                {longDay(selected.valid_for)}: {RISK_LEVEL_META[selected.risk_level].label} ({pct(selected.risk_score)})
              </p>
            )}
          </div>
        )}
      </Section>
    </>
  );
}

function ResultView({ place }: { place: ResolvedPlace }) {
  const assessments = usePlaceRisk(place);
  const primary = assessments.find((a) => a.hazard.status === "active")!;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-lp-green">Your risk overview</p>
        <h1 ref={heading} tabIndex={-1} className="font-lp-display text-[36px] leading-[1.06] tracking-[-0.02em] text-lp-ink outline-none sm:text-[52px]">
          {place.district.name}, {place.state.name}
        </h1>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[14px]">
          {[
            ["Country", "India"],
            ["State", place.state.name],
            ["District", place.district.name],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-1.5">
              <dt className="text-lp-ink-3">{k}</dt>
              <dd className="font-medium text-lp-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[13px] text-lp-ink-3">
          {place.nearest ? "Nearest district to your location. " : "Approximate area, based on district boundaries. "}Your exact location was not stored.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <PrimarySummary a={primary} place={place} />

          <Section title="Available climate risk">
            <HazardCards items={assessments} />
          </Section>

          {primary.availability === "data" && primary.status !== "error" && <Explanation key={primary.validFor} a={primary} place={place} />}
        </div>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-lp-line bg-lp-surface">
            <h2 className="px-5 pb-3 pt-5 text-[15px] font-semibold text-lp-ink">Your approximate region</h2>
            <div className="lp-explore-map relative h-[300px] border-t border-lp-line bg-[#eef0ec] sm:h-[360px]">
              <Suspense fallback={<div className="flex h-full items-center justify-center text-[13px] text-lp-ink-3">Loading map…</div>}>
                <RegionPreviewMap place={place} />
              </Suspense>
            </div>
            <p className="px-5 py-3 text-[12.5px] text-lp-ink-3">Your district is outlined. Your exact position is not shown.</p>
          </section>
          <div className="flex flex-col gap-3">
            <ButtonLink to={exploreHref({ state: place.state.slug, district: place.district.slug })} primary>
              Check another location
            </ButtonLink>
            <ButtonLink to={ROUTES.explore}>Explore India</ButtonLink>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function AmISafePage() {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>({ name: "idle" });

  const locate = async () => {
    setPhase({ name: "locating" });
    try {
      // Coordinates stay local to this block: used once to find the district, then dropped.
      const place = await resolvePlace(queryClient, await requestCurrentPosition());
      setPhase({ name: "result", place });
    } catch (err) {
      setPhase({ name: "error", kind: err instanceof LocationError ? err.kind : "region" });
    }
  };

  return (
    <div className="mx-auto min-h-[60vh] max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16 lg:px-8">
      {phase.name === "idle" && <StartView onStart={locate} />}
      {phase.name === "locating" && <LocatingView />}
      {phase.name === "error" && <ErrorView kind={phase.kind} onRetry={locate} />}
      {phase.name === "result" && <ResultView place={phase.place} />}
    </div>
  );
}
