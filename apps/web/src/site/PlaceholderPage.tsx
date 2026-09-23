import type { ReactNode } from "react";
import { Link } from "../lib/router";
import { ROUTES } from "./SiteLayout";

interface Props {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}

/** Intentionally simple page for routes whose features are built in later steps. */
export function PlaceholderPage({ eyebrow = "Coming soon", title, description, children }: Props) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.14em] text-lp-green">{eyebrow}</p>
      <h1 className="max-w-3xl font-lp-display text-[40px] leading-[1.08] tracking-[-0.02em] text-lp-ink sm:text-[56px]">{title}</h1>
      <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-lp-ink-2 sm:text-[18px]">{description}</p>
      {children && <div className="mt-10">{children}</div>}
    </section>
  );
}

/** Small link card to the one live product today, used on /explore. */
export function AssamLiveLink() {
  return (
    <Link
      to={ROUTES.assam}
      className="group inline-flex max-w-md items-center gap-4 rounded-xl border border-lp-line bg-lp-surface px-5 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-lp-green/30 hover:shadow-[0_16px_32px_-24px_rgb(22_32_27/0.35)]"
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-lp-green" aria-hidden="true" />
      <span className="flex-1 leading-tight">
        <span className="block text-[15px] font-semibold text-lp-ink">Available now: Assam Flood Watch</span>
        <span className="mt-1 block text-[13.5px] text-lp-ink-3">District flood-risk forecasts, 7 days ahead</span>
      </span>
      <svg className="h-4 w-4 text-lp-green transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
