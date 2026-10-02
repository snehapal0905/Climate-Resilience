/** Presentational pieces shared by /news and /news/:id. */
import { Link } from "../lib/router";
import { formatDay } from "../lib/format";
import { HazardIcon } from "../hazards/HazardIcon";
import { HazardTile } from "../hazards/HazardBits";
import { getHazard } from "../hazards/registry";
import { useGeoIndex } from "../explore/geo";
import { exploreHref } from "../explore/exploreState";
import { ContourMotif } from "../prepare/PrepareBits";
import { CATEGORY_LABELS, hazardOf, topicLabel, type FeedStatus, type NewsFeed, type NewsItem } from "./feed";

export const newsHref = (id: string) => `/news/${id}`;

/** Neutral colour for the non-hazard themes; hazards use their registry identity colour. */
const THEME_COLOR = "#46514b";
export const topicColor = (item: NewsItem) => {
  const h = hazardOf(item);
  return h ? getHazard(h).color : THEME_COLOR;
};

export function TopicTag({ item }: { item: NewsItem }) {
  const h = hazardOf(item);
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: topicColor(item) }}>
      {h ? <HazardTile hazard={h} size="sm" /> : <span className="h-2 w-2 rounded-full" style={{ background: THEME_COLOR }} aria-hidden="true" />}
      {topicLabel(item.topic)}
    </span>
  );
}

export function SampleBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-dashed border-lp-line-strong bg-lp-bg px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-lp-ink-2">
      Sample
    </span>
  );
}

export function PinIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 14.5s-4.5-4-4.5-7.4a4.5 4.5 0 0 1 9 0c0 3.4-4.5 7.4-4.5 7.4Z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="7" r="1.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** Publication date exactly as the source gives it, or an explicit "no date" for samples. */
export function dateText(item: NewsItem) {
  return item.publishedAt ? formatDay(item.publishedAt, { day: "numeric", month: "short", year: "numeric" }) : "No publication date (sample)";
}

/** Source, type and date, always shown together so no claim appears without attribution. */
export function SourceLine({ item, className = "" }: { item: NewsItem; className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-lp-ink-3 ${className}`}>
      <span className="font-medium text-lp-ink-2">{item.source.name}</span>
      {item.source.type === "official" && (
        <span className="rounded-full bg-lp-green-soft px-2 py-px text-[11.5px] font-semibold text-lp-green">Official source</span>
      )}
      <span aria-hidden="true">·</span>
      {item.publishedAt ? <time dateTime={item.publishedAt}>{dateText(item)}</time> : <span>{dateText(item)}</span>}
    </p>
  );
}

/** Image when the item has one, otherwise a quiet hazard-tinted geospatial motif (no stock imagery). */
export function StoryVisual({ item, large = false }: { item: NewsItem; large?: boolean }) {
  const color = topicColor(item);
  const h = hazardOf(item);
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt={item.imageAlt ?? ""}
        loading="lazy"
        decoding="async"
        className={`w-full object-cover ${large ? "aspect-[16/9]" : "aspect-[16/7]"}`}
      />
    );
  }
  return (
    <div
      className={`relative overflow-hidden ${large ? "aspect-[16/9] sm:aspect-[16/8]" : "aspect-[16/6]"}`}
      style={{ color, background: `color-mix(in srgb, ${color} 8%, var(--lp-bg))` }}
      aria-hidden="true"
    >
      <ContourMotif className="absolute inset-0 h-full w-full opacity-60" />
      {h && <HazardIcon hazard={h} className={`absolute opacity-[0.14] ${large ? "bottom-4 right-6 h-28 w-28 sm:h-36 sm:w-36" : "bottom-2 right-4 h-16 w-16"}`} />}
    </div>
  );
}

/**
 * "Explore this region": only when the item's state slug exists in the Explore geo index.
 * Returns undefined while the index loads, on error, or for unknown slugs, so no link is invented.
 */
export function useExploreRegion(item: NewsItem): { href: string; name: string } | undefined {
  const index = useGeoIndex();
  if (!item.stateSlug || !index.data) return undefined;
  const state = index.data.states.find((s) => s.slug === item.stateSlug);
  if (!state) return undefined;
  return { href: exploreHref({ hazard: hazardOf(item), state: state.slug }), name: state.name };
}

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-lp-line bg-lp-surface transition duration-300 hover:-translate-y-0.5 hover:border-lp-green/30 hover:shadow-[0_16px_32px_-24px_rgb(22_32_27/0.35)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-lp-green">
      <StoryVisual item={item} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TopicTag item={item} />
          {item.source.type === "demo" && <SampleBadge />}
        </div>
        <h3 className="mt-3 text-[17.5px] font-semibold leading-snug text-lp-ink">
          {/* The title link covers the whole card, so the card is one tap target and one tab stop. */}
          <Link to={newsHref(item.id)} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {item.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-[14.5px] leading-relaxed text-lp-ink-2">{item.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-lp-ink-3">
          <span>{CATEGORY_LABELS[item.category]}</span>
          {item.location && (
            <span className="inline-flex items-center gap-1">
              <PinIcon />
              {item.location}
            </span>
          )}
        </div>
        <SourceLine item={item} className="mt-2" />
        <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-lp-green">
          Read more
          <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </article>
  );
}

const STATUS_META: Record<FeedStatus, { label: string; tone: string }> = {
  live: { label: "Live", tone: "border-lp-green/30 bg-lp-green-soft text-lp-green" },
  updated: { label: "Updated", tone: "border-lp-green/30 bg-lp-green-soft text-lp-green" },
  demo: { label: "Demo", tone: "border-dashed border-lp-line-strong bg-lp-bg text-lp-ink-2" },
  no_data: { label: "No data", tone: "border-lp-line-strong bg-lp-bg text-lp-ink-2" },
  error: { label: "Unavailable", tone: "border-lp-line-strong bg-lp-bg text-lp-ink-2" },
};

/** The feed's data state, always visible, in text (never colour alone). */
export function FeedStatusPanel({ feed }: { feed: NewsFeed }) {
  const meta = STATUS_META[feed.status];
  let headline: string;
  let detail: string;
  switch (feed.status) {
    case "demo":
      headline = "Demo data — live news integration pending.";
      detail = "Live news integration is not connected yet. The stories below are sample briefings that show how this page works; they are not reports of real events.";
      break;
    case "live":
    case "updated":
      headline = feed.status === "live" ? "Live news feed" : "News feed";
      detail = "Stories come from the sources named on each item.";
      break;
    case "no_data":
      headline = "No stories in the feed right now.";
      detail = "This does not mean there are no climate or disaster events.";
      break;
    case "error":
      headline = feed.fromCache && feed.items.length > 0 ? "News could not be refreshed. Showing the last available information." : "News is temporarily unavailable.";
      detail = "Live news integration is currently unavailable.";
      break;
  }
  return (
    <section aria-label="News feed status" className="rounded-xl border border-lp-line bg-lp-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-[0.1em] ${meta.tone}`}>{meta.label}</span>
        {feed.lastUpdated && (
          <span className="text-[13px] text-lp-ink-3">
            Last updated: <time dateTime={feed.lastUpdated}>{formatDay(feed.lastUpdated, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
          </span>
        )}
      </div>
      <p className="mt-3 text-[15px] font-semibold leading-snug text-lp-ink">{headline}</p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-lp-ink-2">{detail}</p>
    </section>
  );
}
