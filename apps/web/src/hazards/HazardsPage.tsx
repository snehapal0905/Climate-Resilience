/** /hazards — overview of every hazard in the registry. */
import { Link } from "../lib/router";
import { HazardStatusBadge, HazardTile } from "./HazardBits";
import { exploreHazardHref, HAZARD_REGISTRY } from "./registry";

export default function HazardsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16 lg:px-8">
      <header className="max-w-3xl">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-lp-green">Hazards</p>
        <h1 className="font-lp-display text-[34px] leading-[1.08] tracking-[-0.02em] text-lp-ink sm:text-[52px]">Understand Climate &amp; Disaster Risk</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-lp-ink-2 sm:text-[18px]">Explore the hazards that shape climate resilience across India.</p>
      </header>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HAZARD_REGISTRY.map((h) => {
          const active = h.status === "active";
          return (
            <li key={h.id}>
              <Link
                to={exploreHazardHref(h.id)}
                aria-label={`${h.name}, ${active ? "active: explore risk" : "coming soon"}`}
                className="group flex h-full flex-col rounded-xl border border-lp-line bg-lp-surface p-6 transition duration-300 hover:-translate-y-0.5 hover:border-lp-green/30 hover:shadow-[0_16px_32px_-24px_rgb(22_32_27/0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-green"
              >
                <div className="flex items-start justify-between gap-3">
                  <HazardTile hazard={h.id} />
                  <HazardStatusBadge status={h.status} />
                </div>
                <h2 className="mt-6 text-[19px] font-semibold text-lp-ink">{h.name}</h2>
                <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-lp-ink-2">{h.description}</p>
                <span className={`mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium ${active ? "text-lp-green" : "text-lp-ink-3"}`}>
                  {active ? "Explore risk" : "See what's planned"}
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 max-w-2xl text-[13.5px] leading-relaxed text-lp-ink-3">
        <span className="font-medium text-lp-ink-2">Active</span> hazards have a prediction model behind them.{" "}
        <span className="font-medium text-lp-ink-2">Coming soon</span> hazards are on the roadmap and show no risk data until a model exists.
      </p>
    </div>
  );
}
