/** /prepare/:hazard — preparedness guide for one hazard. Identity from the registry, guidance from content.ts. */
import type { ReactNode } from "react";
import type { Hazard } from "@climate/shared";
import { Link } from "../lib/router";
import { HazardIcon } from "../hazards/HazardIcon";
import { HazardTile } from "../hazards/HazardBits";
import { exploreHazardHref, getHazard, HAZARD_REGISTRY, prepareHazardHref, type HazardMeta } from "../hazards/registry";
import { ROUTES } from "../site/SiteLayout";
import { getPreparedness, type PreparednessGuide } from "./content";
import { ContourMotif, Disclaimer, DO_NOT_INK, DoNotList, EmergencyKit, OfficialGuidance, SectionTitle, StageChecklists, WarningIcon } from "./PrepareBits";

const JUMP_LINKS = [
  { href: "#understand", label: "Understand" },
  { href: "#stage-before", label: "Before" },
  { href: "#stage-during", label: "During" },
  { href: "#stage-after", label: "After" },
  { href: "#do-not", label: "What not to do" },
  { href: "#kit", label: "Emergency kit" },
];

function Header({ hazard, hasGuide }: { hazard: HazardMeta; hasGuide: boolean }) {
  return (
    <section className="relative overflow-hidden border-b border-lp-line" style={{ color: hazard.color, background: `color-mix(in srgb, ${hazard.color} 7%, var(--lp-bg))` }}>
      <ContourMotif className="absolute -right-28 top-0 hidden h-full w-[640px] opacity-70 sm:block" />
      <HazardIcon hazard={hazard.id} className="pointer-events-none absolute -right-6 -top-4 h-48 w-48 opacity-[0.07] sm:right-12 sm:top-6 sm:h-64 sm:w-64" />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-[13.5px] text-lp-ink-3">
            <li>
              <Link to={ROUTES.prepare} className="underline-offset-4 hover:text-lp-ink hover:underline">
                Prepare
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-medium text-lp-ink">
              {hazard.name}
            </li>
          </ol>
        </nav>

        <div className="mt-8 flex items-start gap-4 sm:gap-5">
          <HazardTile hazard={hazard.id} size="lg" />
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-lp-ink-3">Preparedness guide</p>
            <h1 className="mt-1 font-lp-display text-[38px] leading-[1.05] tracking-[-0.02em] text-lp-ink sm:text-[52px]">{hazard.name}</h1>
          </div>
        </div>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-lp-ink-2">{hazard.description}</p>

        {hasGuide && (
          <nav aria-label="On this page" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {JUMP_LINKS.map((j) => (
                <li key={j.href}>
                  <a
                    href={j.href}
                    className="inline-flex min-h-9 items-center rounded-full border border-lp-line-strong bg-lp-surface/90 px-3.5 text-[13.5px] font-medium text-lp-ink transition-colors hover:border-lp-ink-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-green"
                  >
                    {j.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </section>
  );
}

/** Keeps guidance and live/model intelligence visibly separate, and honest about what exists. */
function RiskIntelligenceNote({ hazard }: { hazard: HazardMeta }) {
  const active = hazard.status === "active";
  return (
    <aside aria-label="Live risk information" className="flex flex-col gap-3 rounded-xl border border-lp-line bg-lp-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[14.5px] leading-relaxed text-lp-ink-2">
        <span className="font-medium text-lp-ink">This page is general guidance, not a live alert or forecast.</span>{" "}
        {active
          ? `Model-based ${hazard.name.toLowerCase()} risk information is available separately for covered districts.`
          : `ClimateResilience does not yet provide live risk information for ${hazard.name.toLowerCase()}.`}
      </p>
      {active && (
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            to={exploreHazardHref(hazard.id)}
            className="rounded-full bg-lp-green px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-lp-green-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-green"
          >
            View {hazard.name.toLowerCase()} risk map
          </Link>
          <Link
            to={ROUTES.amISafe}
            className="rounded-full border border-lp-line-strong px-4 py-2 text-[14px] font-medium text-lp-ink transition-colors hover:border-lp-ink-3"
          >
            Am I Safe?
          </Link>
        </div>
      )}
    </aside>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-lp-line bg-lp-surface p-5 sm:p-6">
      <h3 className="text-[17px] font-semibold text-lp-ink">{title}</h3>
      <div className="mt-3 text-[15px] leading-relaxed text-lp-ink-2">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-lp-ink-3" aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Guide({ hazard, guide }: { hazard: HazardMeta; guide: PreparednessGuide }) {
  return (
    <>
      <section id="understand" aria-labelledby="understand-title" className="scroll-mt-20">
        <SectionTitle id="understand-title" eyebrow="Understand" title={`About ${hazard.name.toLowerCase()}`} />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard title="What is it?">
            <p>{guide.overview}</p>
          </InfoCard>
          <InfoCard title="Why does it happen?">
            <p>{guide.causes}</p>
          </InfoCard>
          <InfoCard title="Who may be more vulnerable?">
            <BulletList items={guide.vulnerableGroups} />
          </InfoCard>
          <InfoCard title="Warning signs and things to watch">
            {guide.warningNote && <p className="mb-3 font-medium text-lp-ink">{guide.warningNote}</p>}
            <BulletList items={guide.warningSigns} />
            <p className="mt-4 text-[13.5px] text-lp-ink-3">These signs help you stay alert. They are not a prediction; conditions can change quickly.</p>
          </InfoCard>
        </div>
      </section>

      <section aria-labelledby="stages-title" className="mt-16 sm:mt-20">
        <SectionTitle id="stages-title" eyebrow="Take action" title="Before, during and after">
          Tick items off as you go. Nothing you tick is saved or shared.
        </SectionTitle>
        <div className="mt-6">
          <StageChecklists guide={guide} />
        </div>
      </section>

      <section id="do-not" aria-labelledby="do-not-title" className="mt-16 scroll-mt-20 sm:mt-20">
        <h2 id="do-not-title" className="flex items-center gap-2.5 font-lp-display text-[28px] leading-[1.12] tracking-[-0.015em] text-lp-ink sm:text-[36px]">
          <span style={{ color: DO_NOT_INK }}>
            <WarningIcon className="h-7 w-7" />
          </span>
          What NOT to do
        </h2>
        <div className="mt-6">
          <DoNotList items={guide.doNot} />
        </div>
      </section>

      <section id="kit" aria-labelledby="kit-title" className="mt-16 scroll-mt-20 sm:mt-20">
        <SectionTitle id="kit-title" eyebrow="For every hazard" title="Build your emergency kit">
          Keep these essentials together in one bag that is easy to carry.
        </SectionTitle>
        <div className="mt-6">
          <EmergencyKit extras={guide.kitExtras} hazardName={hazard.name} />
        </div>
      </section>

      <section aria-label="Official guidance" className="mt-10">
        <OfficialGuidance sources={guide.sources} />
      </section>
    </>
  );
}

function GuideUnavailable({ hazard }: { hazard: HazardMeta }) {
  return (
    <div className="rounded-xl border border-dashed border-lp-line-strong bg-lp-surface px-6 py-12 text-center">
      <p className="text-[17px] font-medium text-lp-ink">Preparedness guidance for this hazard is being developed.</p>
      <p className="mx-auto mt-2 max-w-md text-[15px] text-lp-ink-2">
        In the meantime, follow advisories from your local authorities about {hazard.name.toLowerCase()}, and keep a basic emergency kit ready.
      </p>
      <Link to={ROUTES.prepare} className="mt-6 inline-block text-[15px] font-medium text-lp-green underline-offset-4 hover:underline">
        See all preparedness guides
      </Link>
    </div>
  );
}

function OtherHazards({ current }: { current: Hazard }) {
  return (
    <nav aria-labelledby="other-guides-title" className="border-t border-lp-line bg-lp-surface/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 id="other-guides-title" className="text-[13px] font-medium uppercase tracking-[0.14em] text-lp-ink-3">
          Other preparedness guides
        </h2>
        <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {HAZARD_REGISTRY.filter((h) => h.id !== current).map((h) => (
            <li key={h.id}>
              <Link
                to={prepareHazardHref(h.id)}
                className="flex min-h-12 items-center gap-2.5 rounded-lg border border-lp-line bg-lp-surface px-3 py-2 text-[14.5px] font-medium text-lp-ink transition-colors hover:border-lp-green/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-green"
              >
                <HazardTile hazard={h.id} size="sm" />
                {h.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default function HazardGuidePage({ hazard: id }: { hazard: Hazard }) {
  const hazard = getHazard(id);
  const guide = getPreparedness(id);
  return (
    <>
      <Header hazard={hazard} hasGuide={guide !== undefined} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <RiskIntelligenceNote hazard={hazard} />
        <div className="mt-12">{guide ? <Guide hazard={hazard} guide={guide} /> : <GuideUnavailable hazard={hazard} />}</div>
        <div className="mt-10">
          <Disclaimer />
        </div>
      </div>
      <OtherHazards current={id} />
    </>
  );
}
