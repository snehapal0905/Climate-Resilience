/** /news — Climate & Disaster Intelligence. An information layer only: no alerts, predictions or risk levels. */
import { useId, useMemo, useState } from "react";
import { Link } from "../lib/router";
import { OFFICIAL_SOURCES } from "../emergency/contacts";
import { ContourMotif } from "../prepare/PrepareBits";
import { ROUTES } from "../site/SiteLayout";
import { CATEGORY_LABELS, EMPTY_FILTERS, filterNews, getNewsFeed, locationsOf, NEWS_TOPICS, type NewsCategory, type NewsFilters, type NewsItem, type NewsTopic } from "./feed";
import { FeedStatusPanel, NewsCard, newsHref, PinIcon, SampleBadge, SourceLine, StoryVisual, TopicTag } from "./NewsBits";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-green";

function Hero({ feed }: { feed: ReturnType<typeof getNewsFeed> }) {
  return (
    <section className="relative overflow-hidden border-b border-lp-line">
      <ContourMotif className="absolute -left-40 top-0 hidden h-full w-[720px] text-lp-sage opacity-60 lg:block" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:px-8">
        <div>
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-lp-green">News &amp; Insights</p>
          <h1 className="font-lp-display text-[38px] leading-[1.06] tracking-[-0.02em] text-lp-ink sm:text-[54px]">Climate &amp; Disaster Intelligence</h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-lp-ink-2 sm:text-[18px]">
            Stay informed about climate risks, extreme weather, disasters, and resilience across India.
          </p>
        </div>
        <FeedStatusPanel feed={feed} />
      </div>
    </section>
  );
}

function Featured({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;
  const [lead, ...rest] = items;
  return (
    <section aria-labelledby="featured-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="featured-title" className="font-lp-display text-[28px] leading-tight tracking-[-0.015em] text-lp-ink sm:text-[34px]">
          Featured Intelligence
        </h2>
        <p className="text-[13.5px] text-lp-ink-3">An editorial selection. Not ranked by severity or risk.</p>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <article className="group relative overflow-hidden rounded-2xl border border-lp-line bg-lp-surface has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-lp-green">
          <StoryVisual item={lead} large />
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TopicTag item={lead} />
              {lead.source.type === "demo" && <SampleBadge />}
            </div>
            <h3 className="mt-3 font-lp-display text-[26px] leading-[1.15] text-lp-ink sm:text-[32px]">
              <Link to={newsHref(lead.id)} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                {lead.title}
              </Link>
            </h3>
            <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-lp-ink-2">{lead.summary}</p>
            {lead.location && (
              <p className="mt-4 inline-flex items-center gap-1 text-[13.5px] text-lp-ink-3">
                <PinIcon />
                {lead.location}
              </p>
            )}
            <SourceLine item={lead} className="mt-2" />
          </div>
        </article>
        <ul className="flex flex-col divide-y divide-lp-line rounded-2xl border border-lp-line bg-lp-surface">
          {rest.map((item) => (
            <li key={item.id} className="relative p-5 hover:bg-lp-bg has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-lp-green">
              <article>
                <div className="flex items-center justify-between gap-2">
                  <TopicTag item={item} />
                  {item.source.type === "demo" && <SampleBadge />}
                </div>
                <h3 className="mt-2 text-[17px] font-semibold leading-snug text-lp-ink">
                  <Link to={newsHref(item.id)} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                    {item.title}
                  </Link>
                </h3>
                <SourceLine item={item} className="mt-2" />
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FilterPanel({ filters, set, locations }: { filters: NewsFilters; set: (f: NewsFilters) => void; locations: string[] }) {
  const ids = useId();
  const [open, setOpen] = useState(false);
  const active = [filters.topic !== "all", filters.location !== "all", filters.category !== "all", filters.officialOnly].filter(Boolean).length;
  const select = `min-h-11 w-full rounded-lg border border-lp-line-strong bg-lp-surface px-3 text-[14.5px] text-lp-ink ${focusRing}`;
  const chip = (on: boolean) =>
    `inline-flex min-h-10 items-center rounded-full border px-3.5 text-[14px] font-medium transition-colors ${
      on ? "border-lp-green bg-lp-green-soft text-lp-green" : "border-lp-line bg-lp-surface text-lp-ink hover:border-lp-ink-3"
    } ${focusRing}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <label htmlFor={`${ids}-q`} className="sr-only">
          Search climate and disaster news
        </label>
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lp-ink-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10.5 10.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            id={`${ids}-q`}
            type="search"
            value={filters.query}
            onChange={(e) => set({ ...filters, query: e.target.value })}
            placeholder="Search climate and disaster news…"
            className={`min-h-12 w-full rounded-full border border-lp-line-strong bg-lp-surface pl-10 pr-4 text-[15px] text-lp-ink placeholder:text-lp-ink-3 ${focusRing}`}
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={`${ids}-panel`}
          className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border border-lp-line-strong bg-lp-surface px-4 text-[15px] font-medium text-lp-ink lg:hidden ${focusRing}`}
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2.5 4h11M4.5 8h7M6.5 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Filters{active > 0 && <span className="rounded-full bg-lp-green px-1.5 text-[12px] text-white">{active}</span>}
        </button>
      </div>

      {/* Collapsible on mobile, always shown on large screens. */}
      <div id={`${ids}-panel`} className={`${open ? "block" : "hidden"} space-y-4 rounded-xl border border-lp-line bg-lp-surface p-4 lg:block lg:border-0 lg:bg-transparent lg:p-0`}>
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-lp-ink-3">Topic</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={filters.topic === "all"} onClick={() => set({ ...filters, topic: "all" })} className={chip(filters.topic === "all")}>
              All
            </button>
            {NEWS_TOPICS.map((t) => (
              <button key={t.id} type="button" aria-pressed={filters.topic === t.id} onClick={() => set({ ...filters, topic: t.id as NewsTopic })} className={chip(filters.topic === t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
          <div>
            <label htmlFor={`${ids}-loc`} className="mb-1.5 block text-[13px] font-medium text-lp-ink-3">
              Location
            </label>
            <select id={`${ids}-loc`} value={filters.location} onChange={(e) => set({ ...filters, location: e.target.value })} className={select}>
              <option value="all">All locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${ids}-cat`} className="mb-1.5 block text-[13px] font-medium text-lp-ink-3">
              Category
            </label>
            <select id={`${ids}-cat`} value={filters.category} onChange={(e) => set({ ...filters, category: e.target.value as NewsCategory | "all" })} className={select}>
              <option value="all">All categories</option>
              {(Object.keys(CATEGORY_LABELS) as NewsCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 self-end rounded-lg border border-lp-line-strong bg-lp-surface px-3 text-[14.5px] text-lp-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-lp-green">
            <input
              type="checkbox"
              checked={filters.officialOnly}
              onChange={(e) => set({ ...filters, officialOnly: e.target.checked })}
              className="h-[18px] w-[18px] accent-[var(--lp-green)] focus-visible:outline-none"
            />
            Official sources only
          </label>
        </div>
        {active > 0 && (
          <button type="button" onClick={() => set({ ...EMPTY_FILTERS, query: filters.query })} className={`inline-flex min-h-11 items-center text-[14px] font-medium text-lp-green underline-offset-4 hover:underline ${focusRing}`}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

function Stories({ items }: { items: NewsItem[] }) {
  const [filters, setFilters] = useState<NewsFilters>(EMPTY_FILTERS);
  const results = useMemo(() => filterNews(items, filters), [items, filters]);
  const locations = useMemo(() => locationsOf(items), [items]);
  const sample = items.length > 0 && items.every((i) => i.source.type === "demo");

  return (
    <section aria-labelledby="stories-title">
      <h2 id="stories-title" className="font-lp-display text-[28px] leading-tight tracking-[-0.015em] text-lp-ink sm:text-[34px]">
        All stories
      </h2>
      <div className="mt-5">
        <FilterPanel filters={filters} set={setFilters} locations={locations} />
      </div>
      <p className="mt-5 text-[13.5px] text-lp-ink-3" aria-live="polite">
        Showing {results.length} of {items.length} {sample ? "sample " : ""}
        {items.length === 1 ? "story" : "stories"}
      </p>
      {results.length > 0 ? (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => (
            <li key={item.id}>
              <NewsCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-lp-line-strong bg-lp-surface px-6 py-10 text-center">
          <p className="text-[16px] font-medium text-lp-ink">
            {filters.query.trim() ? "No stories match your search." : "No climate or disaster intelligence is available for this filter yet."}
          </p>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-lp-ink-2">
            An empty list does not mean nothing is happening. Check official sources and local authorities for current information.
          </p>
        </div>
      )}
    </section>
  );
}

function OfficialInfo() {
  return (
    <aside aria-labelledby="official-info-title" className="grid gap-4 rounded-2xl border border-lp-line bg-lp-surface p-5 sm:p-7 md:grid-cols-[1.2fr_1fr] md:gap-10">
      <div>
        <h2 id="official-info-title" className="text-[18px] font-semibold text-lp-ink">
          Official information
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-lp-ink-2">
          News here is for context, not alerts. For current warnings and instructions, follow government and local authorities.
        </p>
        <ul className="mt-4 space-y-3">
          {OFFICIAL_SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-10 items-center text-[15px] font-medium text-lp-green underline-offset-4 hover:underline ${focusRing}`}>
                {s.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <span className="block text-[13px] text-lp-ink-3">{s.publisher}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl bg-lp-alert-soft p-5">
        <p className="text-[15px] font-semibold text-lp-ink">In an emergency?</p>
        <p className="mt-1 text-[14px] leading-relaxed text-lp-ink-2">Emergency contacts and what to do right now are in the Emergency Center.</p>
        <Link to={ROUTES.emergency} className={`mt-3 inline-flex min-h-11 items-center gap-2 font-medium text-lp-alert underline-offset-4 hover:underline ${focusRing}`}>
          <span className="h-2 w-2 rounded-full bg-lp-alert" aria-hidden="true" />
          Open the Emergency Center
        </Link>
      </div>
    </aside>
  );
}

export default function NewsPage() {
  const feed = getNewsFeed();
  const featured = feed.items.filter((i) => i.featured);
  return (
    <>
      <Hero feed={feed} />
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:space-y-20 sm:px-6 sm:py-16 lg:px-8">
        <Featured items={featured} />
        <Stories items={feed.items} />
        <OfficialInfo />
      </div>
    </>
  );
}
