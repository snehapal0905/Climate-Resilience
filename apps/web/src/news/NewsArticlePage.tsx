/**
 * /news/:id — one story. Shows only the metadata and summary we hold, never the full article:
 * the original is linked at its source. Context links go to preparedness guidance and Explore.
 */
import type { ReactNode } from "react";
import { Link } from "../lib/router";
import { getHazard, prepareHazardHref } from "../hazards/registry";
import { ROUTES } from "../site/SiteLayout";
import { CATEGORY_LABELS, getNewsFeed, getNewsItem, hazardOf, SOURCE_TYPE_LABELS, topicLabel, type NewsItem } from "./feed";
import { NewsCard, PinIcon, SampleBadge, SourceLine, StoryVisual, TopicTag, useExploreRegion } from "./NewsBits";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-green";
const primary = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-lp-green px-5 text-[15px] font-medium text-white hover:bg-lp-green-deep ${focusRing}`;
const secondary = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-lp-line-strong bg-lp-surface px-5 text-[15px] font-medium text-lp-ink hover:border-lp-ink-3 ${focusRing}`;

function Arrow() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SourceBox({ item }: { item: NewsItem }) {
  return (
    <section aria-labelledby="source-title" className="rounded-xl border border-lp-line bg-lp-surface p-5">
      <h2 id="source-title" className="text-[13px] font-medium uppercase tracking-[0.12em] text-lp-ink-3">
        Source
      </h2>
      <p className="mt-2 text-[15px] font-semibold text-lp-ink">{item.source.name}</p>
      <p className="text-[13.5px] text-lp-ink-3">{SOURCE_TYPE_LABELS[item.source.type]}</p>
      {item.source.url ? (
        <>
          <p className="mt-3 text-[14.5px] text-lp-ink-2">Read the full story at the original source.</p>
          <a href={item.source.url} target="_blank" rel="noopener noreferrer" className={`${primary} mt-3 w-full`}>
            Open original source
            <span className="sr-only"> (opens in a new tab)</span>
            <Arrow />
          </a>
        </>
      ) : (
        <p className="mt-3 text-[14.5px] leading-relaxed text-lp-ink-2">This is sample content, so there is no original article to link to.</p>
      )}
    </section>
  );
}

/** Factual context only: restates what the item is about. No consequences, forecasts or risk. */
function WhatThisMeans({ item }: { item: NewsItem }) {
  const hazard = hazardOf(item);
  const rows: Array<[string, ReactNode]> = [
    ["Event", item.context?.event ?? "Not specified by the source."],
    ["Region", item.location ?? "Not specified"],
    ["Relevant hazard", hazard ? getHazard(hazard).name : `${topicLabel(item.topic)} (not a single hazard)`],
    [
      "Preparedness resource",
      <Link key="p" to={hazard ? prepareHazardHref(hazard) : ROUTES.prepare} className={`font-medium text-lp-green underline-offset-4 hover:underline ${focusRing}`}>
        {hazard ? `${getHazard(hazard).name} preparedness guide` : "Preparedness guides"}
      </Link>,
    ],
  ];
  return (
    <section aria-labelledby="meaning-title" className="rounded-xl border border-lp-line bg-lp-surface p-5 sm:p-6">
      <h2 id="meaning-title" className="text-[18px] font-semibold text-lp-ink">
        What this means
      </h2>
      <dl className="mt-4 divide-y divide-lp-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
            <dt className="text-[13.5px] font-medium text-lp-ink-3">{k}</dt>
            <dd className="text-[15px] text-lp-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[13px] text-lp-ink-3">This is context, not a risk assessment or an alert.</p>
    </section>
  );
}

function NextSteps({ item }: { item: NewsItem }) {
  const hazard = hazardOf(item);
  const region = useExploreRegion(item);
  // The Assam Flood Watch dashboard is the existing detailed view for flood in Assam.
  const dashboard = hazard === "flood" && item.stateSlug === "assam" ? getHazard("flood").dashboardPath : undefined;
  return (
    <section aria-labelledby="next-title">
      <h2 id="next-title" className="text-[13px] font-medium uppercase tracking-[0.12em] text-lp-ink-3">
        Understand and prepare
      </h2>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {hazard ? (
          <Link to={prepareHazardHref(hazard)} className={primary}>
            Understand {getHazard(hazard).name} Risk
            <Arrow />
          </Link>
        ) : (
          <Link to={ROUTES.prepare} className={primary}>
            Preparedness guides
            <Arrow />
          </Link>
        )}
        {region && (
          <Link to={region.href} className={secondary}>
            <PinIcon className="h-4 w-4" />
            Explore this region: {region.name}
          </Link>
        )}
        {dashboard && (
          <Link to={dashboard} className={secondary}>
            Open Assam Flood Watch
            <Arrow />
          </Link>
        )}
      </div>
    </section>
  );
}

export default function NewsArticlePage({ id }: { id: string }) {
  const feed = getNewsFeed();
  // The route only renders this page for IDs that exist in the feed.
  const item = getNewsItem(id)!;
  const related = feed.items.filter((i) => i.id !== item.id && (i.topic === item.topic || (item.location && i.location === item.location))).slice(0, 3);
  const fallbackRelated = related.length > 0 ? related : feed.items.filter((i) => i.id !== item.id).slice(0, 3);

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex min-w-0 items-center gap-2 text-[13.5px] text-lp-ink-3">
            <li>
              <Link to={ROUTES.news} className="underline-offset-4 hover:text-lp-ink hover:underline">
                News &amp; Insights
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="min-w-0 truncate font-medium text-lp-ink">
              {item.title}
            </li>
          </ol>
        </nav>
      </div>

      <article className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header>
          <div className="flex flex-wrap items-center gap-3">
            <TopicTag item={item} />
            <span className="text-[13px] text-lp-ink-3">{CATEGORY_LABELS[item.category]}</span>
            {item.source.type === "demo" && <SampleBadge />}
          </div>
          <h1 className="mt-4 font-lp-display text-[32px] leading-[1.1] tracking-[-0.02em] text-lp-ink sm:text-[46px]">{item.title}</h1>
          <SourceLine item={item} className="mt-4 text-[14px]" />
          {item.location && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-lp-ink-2">
              <PinIcon className="h-4 w-4" />
              {item.location}
            </p>
          )}
        </header>

        {item.source.type === "demo" && (
          <p className="mt-6 rounded-lg border border-dashed border-lp-line-strong bg-lp-bg px-4 py-3 text-[14px] leading-relaxed text-lp-ink-2">
            <span className="font-semibold text-lp-ink">Demo data — live news integration pending.</span> This sample shows how a story page works. It is not a report of a real
            event.
          </p>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border border-lp-line">
          <StoryVisual item={item} large />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <section aria-labelledby="summary-title">
              <h2 id="summary-title" className="text-[13px] font-medium uppercase tracking-[0.12em] text-lp-ink-3">
                Summary
              </h2>
              <p className="mt-3 text-[18px] leading-relaxed text-lp-ink">{item.summary}</p>
            </section>
            <WhatThisMeans item={item} />
            <NextSteps item={item} />
          </div>
          <div className="lg:pt-8">
            <SourceBox item={item} />
          </div>
        </div>
      </article>

      {fallbackRelated.length > 0 && (
        <section aria-labelledby="related-title" className="border-t border-lp-line bg-lp-surface/60">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 id="related-title" className="font-lp-display text-[26px] text-lp-ink">
              Related stories
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fallbackRelated.map((r) => (
                <li key={r.id}>
                  <NewsCard item={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
