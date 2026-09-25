/** /prepare — preparedness hub. Educational guidance only; no forecasts, risk levels or alerts. */
import { Link } from "../lib/router";
import { HazardTile } from "../hazards/HazardBits";
import { HAZARD_REGISTRY, prepareHazardHref } from "../hazards/registry";
import { ROUTES } from "../site/SiteLayout";
import { getPreparedness } from "./content";
import { ArrowIcon, ContourMotif, Disclaimer, EmergencyKit, SectionTitle, STAGES } from "./PrepareBits";

const STAGE_SUMMARY: Record<(typeof STAGES)[number]["id"], string> = {
  before: "Plan routes, pack a kit and know where safer places are.",
  during: "Follow official instructions and move away from danger.",
  after: "Return only when it is safe and watch for hidden hazards.",
};

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-lp-line">
      <ContourMotif className="absolute -right-24 top-0 hidden h-full w-[720px] text-lp-sage sm:block" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:px-8">
        <div className="lp-rise">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-lp-green">Prepare</p>
          <h1 className="font-lp-display text-[38px] leading-[1.06] tracking-[-0.02em] text-lp-ink sm:text-[56px]">Know what to do before it happens.</h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-lp-ink-2 sm:text-[18px]">
            Practical guidance to help you prepare, respond, and recover during climate and natural hazards.
          </p>
          <a
            href="#guides"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-lp-green px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-lp-green-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-green"
          >
            Choose a hazard
            <ArrowIcon />
          </a>
        </div>

        <ol className="lp-rise grid gap-px overflow-hidden rounded-2xl border border-lp-line bg-lp-line [animation-delay:120ms]" aria-label="How each guide is organised">
          {STAGES.map((s, i) => (
            <li key={s.id} className="flex gap-4 bg-lp-surface/95 px-5 py-4">
              <span className="font-lp-display text-[15px]" style={{ color: s.color }} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-lp-ink">{s.label}</span>
                <span className="block text-[14px] leading-snug text-lp-ink-2">{STAGE_SUMMARY[s.id]}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function GuideGrid() {
  return (
    <section id="guides" aria-labelledby="guides-title" className="scroll-mt-20 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle id="guides-title" eyebrow="Preparedness guides" title="Choose a hazard">
          Each guide covers what the hazard is, signs to watch, what to do before, during and after, and what not to do.
        </SectionTitle>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HAZARD_REGISTRY.map((h) => {
            const available = getPreparedness(h.id) !== undefined;
            return (
              <li key={h.id}>
                <Link
                  to={prepareHazardHref(h.id)}
                  className="group flex h-full flex-col rounded-xl border border-lp-line bg-lp-surface p-6 transition duration-300 hover:-translate-y-0.5 hover:border-lp-green/30 hover:shadow-[0_16px_32px_-24px_rgb(22_32_27/0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-green"
                >
                  <HazardTile hazard={h.id} />
                  <h3 className="mt-5 text-[19px] font-semibold text-lp-ink">{h.name}</h3>
                  <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-lp-ink-2">{h.description}</p>
                  <span className={`mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium ${available ? "text-lp-green" : "text-lp-ink-3"}`}>
                    {available ? "Learn how to prepare" : "Guidance in development"}
                    <ArrowIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <aside className="mt-8 flex flex-col gap-4 rounded-xl border border-lp-line bg-lp-bg p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-label="About this guidance">
          <p className="max-w-2xl text-[14.5px] leading-relaxed text-lp-ink-2">
            <span className="font-medium text-lp-ink">This is guidance, not a forecast.</span> These pages don't show live alerts or risk levels. For
            model-based risk information where it is available, use the risk map or check your location.
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to={ROUTES.explore}
              className="rounded-full border border-lp-line-strong bg-lp-surface px-4 py-2 text-[14px] font-medium text-lp-ink transition-colors hover:border-lp-ink-3"
            >
              Risk map
            </Link>
            <Link
              to={ROUTES.amISafe}
              className="rounded-full border border-lp-line-strong bg-lp-surface px-4 py-2 text-[14px] font-medium text-lp-ink transition-colors hover:border-lp-ink-3"
            >
              Am I Safe?
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

function KitSection() {
  return (
    <section id="emergency-kit" aria-labelledby="kit-title" className="scroll-mt-20 border-t border-lp-line bg-lp-surface/60 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.7fr] lg:gap-14">
          <SectionTitle id="kit-title" eyebrow="For every hazard" title="Build your emergency kit">
            Keep these essentials together in one bag that is easy to carry, and check it every few months so food, water, medicines and batteries stay usable.
          </SectionTitle>
          <EmergencyKit />
        </div>
      </div>
    </section>
  );
}

export default function PreparePage() {
  return (
    <>
      <Hero />
      <GuideGrid />
      <KitSection />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-2 sm:px-6 lg:px-8">
        <Disclaimer />
      </div>
    </>
  );
}
