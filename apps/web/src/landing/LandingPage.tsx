import { useState, type ReactNode } from "react";
import { Link } from "../lib/router";
import { PrimaryButton, ROUTES } from "../site/SiteLayout";
import { HazardIcon, type HazardKey } from "./HazardIcon";
import { HeroIndiaVisual, IndiaPreviewMap } from "./IndiaVisuals";

const HAZARDS: Array<{ key: HazardKey; label: string }> = [
  { key: "flood", label: "Flood" },
  { key: "heatwave", label: "Heatwave" },
  { key: "cyclone", label: "Cyclone" },
  { key: "drought", label: "Drought" },
  { key: "landslide", label: "Landslide" },
  { key: "wildfire", label: "Wildfire" },
  { key: "lightning", label: "Lightning" },
];

const ACTIONS = [
  { title: "Know your risk", body: "Understand the hazards affecting your region." },
  { title: "Prepare early", body: "Get clear, practical guidance before an event occurs." },
  { title: "Act when it matters", body: "Access alerts, emergency information and recommended actions." },
];

const PREPARE: Array<{ key: HazardKey; label: string; body: string }> = [
  { key: "flood", label: "Flood", body: "Know what to do before, during and after flooding." },
  { key: "heatwave", label: "Heatwave", body: "Stay cool, hydrated and safe when temperatures soar." },
  { key: "cyclone", label: "Cyclone", body: "Secure your home and plan your route to shelter early." },
  { key: "earthquake", label: "Earthquake", body: "Drop, cover and hold on, and know what to do after the shaking stops." },
];

const PILLARS = [
  { title: "AI", body: "Models that turn weather, river and terrain signals into risk estimates, with the factors behind each one shown." },
  { title: "Geospatial intelligence", body: "Satellite, reanalysis and boundary data brought together at district level." },
  { title: "Risk forecasting", body: "Day-by-day outlooks that show how risk may develop, not just where it stands today." },
  { title: "Local context", body: "Guidance in local languages, grounded in official advisories and nearby conditions." },
];

function LiveCard({ className }: { className: string }) {
  return (
    <Link
      to={ROUTES.assam}
      className={`lp-rise items-center gap-3 rounded-xl border border-lp-line bg-lp-surface/95 px-4 py-3 shadow-[0_8px_30px_-12px_rgb(22_32_27/0.25)] transition hover:-translate-y-0.5 ${className}`}
      style={{ animationDelay: "0.25s" }}
    >
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="lp-ping absolute inline-flex h-full w-full rounded-full bg-lp-green" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lp-green" />
      </span>
      <span className="text-left leading-tight">
        <span className="block text-[13px] font-semibold text-lp-ink">Live now: Assam</span>
        <span className="block text-[12px] text-lp-ink-3">District flood forecasts, 7 days ahead</span>
      </span>
    </Link>
  );
}

function Hero() {
  const [locationNote, setLocationNote] = useState(false);
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-4 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="lp-rise relative z-10">
          <h1 className="font-lp-display text-[40px] leading-[1.05] tracking-[-0.02em] text-lp-ink sm:text-[56px] lg:text-[68px]">
            Climate risk is changing.
            <br />
            <span className="italic text-lp-green">Know what is coming.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-lp-ink-2 sm:text-[18px]">
            AI-powered climate intelligence helping people understand where risk is rising, what is happening nearby, and what to do next.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PrimaryButton to={ROUTES.explore} className="w-full sm:w-auto">
              Explore India's Risk
            </PrimaryButton>
            <button
              type="button"
              onClick={() => setLocationNote(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-lp-line-strong bg-lp-surface px-6 py-3 text-[15px] font-medium text-lp-ink transition duration-200 hover:border-lp-ink-3 sm:w-auto"
            >
              <span aria-hidden="true">📍</span> Check My Location
            </button>
          </div>
          <p className={`mt-3 min-h-5 text-[13px] text-lp-ink-3 transition-opacity ${locationNote ? "opacity-100" : "opacity-0"}`} role="status">
            {locationNote ? "Location check is coming soon. For Assam, use “Am I safe?” in Assam Flood Watch." : ""}
          </p>
        </div>

        <div className="relative mx-auto aspect-[1080/1151] w-full max-w-[520px] lg:max-w-none">
          <HeroIndiaVisual />
          <LiveCard className="absolute bottom-[14%] right-[2%] hidden sm:flex" />
        </div>
        {/* On phones the card sits below the map so it doesn't cover it. */}
        <LiveCard className="flex sm:hidden" />
      </div>
    </section>
  );
}

function HazardStrip() {
  return (
    <section id="hazards" className="scroll-mt-20 border-y border-lp-line bg-lp-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-8">
        <p className="shrink-0 text-[14px] text-lp-ink-2">Monitoring climate &amp; disaster risk across India</p>
        <ul className="flex flex-wrap gap-2">
          {HAZARDS.map((h) => (
            <li key={h.key} className="flex items-center gap-2 rounded-full border border-lp-line px-3.5 py-2 text-[14px] text-lp-ink transition-colors hover:border-lp-green/40 hover:bg-lp-green-soft/60">
              <span className="text-lp-green">
                <HazardIcon hazard={h.key} className="h-[18px] w-[18px]" />
              </span>
              {h.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-lp-green">{eyebrow}</p>
      <h2 className="font-lp-display text-[32px] leading-[1.1] tracking-[-0.015em] text-lp-ink sm:text-[44px]">{title}</h2>
      {children && <p className="mt-4 text-[17px] leading-relaxed text-lp-ink-2">{children}</p>}
    </div>
  );
}

function IndiaPreview() {
  const layers = ["Flood", "Heatwave", "Cyclone", "Drought"];
  return (
    <section id="risk-map" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Risk map" title="India, viewed through climate risk.">
          Understand emerging risks across regions, from district-level forecasts to local conditions.
        </SectionHeading>

        <div className="mt-12 overflow-hidden rounded-2xl border border-lp-line bg-lp-surface shadow-[0_1px_0_rgb(22_32_27/0.04),0_24px_48px_-32px_rgb(22_32_27/0.25)]">
          {/* Mock toolbar hinting at the future explorer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lp-line px-4 py-3 sm:px-5">
            <div className="flex flex-wrap gap-1.5" aria-label="Hazard layers (preview)">
              {layers.map((l, i) => (
                <span
                  key={l}
                  className={`rounded-full px-3 py-1 text-[13px] ${i === 0 ? "bg-lp-green text-white" : "border border-lp-line text-lp-ink-3"}`}
                >
                  {l}
                </span>
              ))}
            </div>
            <span className="rounded-full bg-lp-sand px-2.5 py-1 text-[12px] font-medium text-lp-ink-2">Preview</span>
          </div>

          <div className="grid lg:grid-cols-[1.35fr_1fr]">
            <div className="relative border-b border-lp-line bg-[radial-gradient(ellipse_at_60%_40%,var(--lp-green-soft),transparent_70%)] p-6 sm:p-10 lg:border-b-0 lg:border-r">
              <div className="mx-auto aspect-[1020/1131] max-w-[460px]">
                <IndiaPreviewMap />
              </div>
              <div className="mt-4 inline-flex flex-col gap-1.5 rounded-lg border border-lp-line bg-lp-surface/95 px-3 py-2 text-[12px] text-lp-ink-2 sm:absolute sm:bottom-6 sm:left-6 sm:mt-0">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-lp-green" aria-hidden="true" /> Live forecasts
                </span>
                <span className="flex items-center gap-2">
                  <span className="lp-hatch-swatch h-2.5 w-2.5 rounded-sm border border-lp-line-strong" aria-hidden="true" /> Coming soon
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-8 p-6 sm:p-10">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-lp-ink-3">Available today</p>
                <h3 className="mt-2 font-lp-display text-[28px] leading-tight text-lp-ink">Assam Flood Watch</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-lp-ink-2">
                  Seven-day flood-risk outlooks for all 33 districts of Assam, built from rainfall and river-flow data, with the drivers behind each forecast and
                  practical advice for every risk level.
                </p>
                <ul className="mt-6 space-y-3 text-[14.5px] text-lp-ink">
                  {["District-level risk, day by day", "Why the risk is rising, explained", "Guidance in English and Hindi"].map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 shrink-0 text-lp-green" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.3" />
                        <path d="m6.5 10 2.4 2.4 4.6-4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <PrimaryButton to={ROUTES.assam} className="w-full sm:w-auto">
                  Open Assam Flood Watch
                </PrimaryButton>
                <p className="mt-4 text-[13px] leading-relaxed text-lp-ink-3">
                  India-wide coverage is in development. More states and hazards will be added over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Actions() {
  return (
    <section id="platform" className="scroll-mt-20 border-t border-lp-line bg-lp-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Platform" title="From risk to action." />
        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-lp-line bg-lp-line md:grid-cols-3">
          {ACTIONS.map((a, i) => (
            <li key={a.title} className="group flex flex-col bg-lp-surface p-7 transition-colors duration-300 hover:bg-lp-bg sm:p-9">
              <span className="font-lp-display text-[15px] text-lp-green">{String(i + 1).padStart(2, "0")}</span>
              <div className="my-5 h-px w-10 sm:my-8 bg-lp-green/40 transition-all duration-300 group-hover:w-16 group-hover:bg-lp-green" aria-hidden="true" />
              <h3 className="font-lp-display text-[26px] leading-tight text-lp-ink">{a.title}</h3>
              <p className="mt-3 text-[15.5px] leading-relaxed text-lp-ink-2">{a.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Prepare() {
  return (
    <section id="prepare" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow="Prepare" title="Prepared for what comes next." />
          <p className="text-[14px] text-lp-ink-3 md:pb-2">Preparedness guides are coming soon.</p>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PREPARE.map((p) => (
            <li
              key={p.key}
              className="group rounded-xl border border-lp-line bg-lp-surface p-6 transition duration-300 hover:-translate-y-0.5 hover:border-lp-green/30 hover:shadow-[0_16px_32px_-24px_rgb(22_32_27/0.35)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-lp-green-soft text-lp-green">
                <HazardIcon hazard={p.key} className="h-6 w-6" />
              </span>
              <h3 className="mt-6 text-[18px] font-semibold text-lp-ink">{p.label}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-lp-ink-2">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section className="border-t border-lp-line bg-lp-surface py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:gap-20 lg:px-8">
        <div>
          <SectionHeading eyebrow="Our approach" title="Built for informed decisions.">
            Climate resilience starts with timely information, clear explanations and practical action.
          </SectionHeading>
          <p className="mt-8 border-l-2 border-lp-green/40 pl-4 text-[14px] leading-relaxed text-lp-ink-3">
            Forecasts describe likelihood, not certainty. Always follow official warnings from IMD, NDMA and your state disaster management authority.
          </p>
        </div>
        <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="border-t border-lp-line pt-5">
              <dt className="text-[16px] font-semibold text-lp-ink">{p.title}</dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-lp-ink-2">{p.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-lp-green-deep px-6 py-16 text-center sm:px-12 sm:py-20">
        <svg className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.07]" preserveAspectRatio="none" viewBox="0 0 800 300" fill="none" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M-20 ${70 + i * 34}C160 ${30 + i * 34} 300 ${120 + i * 34} 420 ${80 + i * 34}S680 ${20 + i * 34} 820 ${70 + i * 34}`} stroke="currentColor" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="relative">
          <h2 className="mx-auto max-w-3xl font-lp-display text-[32px] leading-[1.1] tracking-[-0.015em] text-white sm:text-[48px]">
            Don't wait for the warning to understand the risk.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-white/75">Explore climate risk across India and start building your resilience.</p>
          <PrimaryButton to={ROUTES.explore} inverted className="mt-9 w-full sm:w-auto">
            Explore India's Risk
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}

/** Landing page content; the header and footer come from SiteLayout. */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <HazardStrip />
      <IndiaPreview />
      <Actions />
      <Prepare />
      <Trust />
      <FinalCta />
    </>
  );
}
