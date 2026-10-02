/**
 * News & Insights data layer.
 *
 * The project has no news API or feed yet, so the feed below is DEMO content: sample briefings
 * that show how the page works. They are general explainers, not reports of events. They carry
 * no publisher, date or URL, because inventing any of those would make them look like real news.
 *
 * When a real source is connected, only `getNewsFeed` changes: it returns items with real
 * `source`, `publishedAt` and `sourceUrl`, a status of "live"/"updated" and a `lastUpdated`
 * timestamp from the feed itself. Nothing here is an alert, forecast or risk level.
 */
import type { Hazard } from "@climate/shared";
import { getHazard, HAZARD_REGISTRY } from "../hazards/registry";

/** Topics are the registry hazards plus two non-hazard themes. */
export type NewsTopic = Hazard | "climate" | "resilience";

export const NEWS_TOPICS: ReadonlyArray<{ id: NewsTopic; label: string }> = [
  ...HAZARD_REGISTRY.map((h) => ({ id: h.id as NewsTopic, label: h.name })),
  { id: "climate", label: "Climate" },
  { id: "resilience", label: "Resilience" },
];

export const topicLabel = (t: NewsTopic) => NEWS_TOPICS.find((x) => x.id === t)?.label ?? t;

export type NewsCategory = "disaster" | "weather" | "policy" | "research" | "explainer";
export const CATEGORY_LABELS: Record<NewsCategory, string> = {
  disaster: "Disaster",
  weather: "Extreme weather",
  policy: "Policy",
  research: "Research",
  explainer: "Explainer",
};

/** official = government / public authority; media = news publisher; demo = sample content. */
export type SourceType = "official" | "media" | "research" | "demo";
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  official: "Official source",
  media: "Media",
  research: "Research",
  demo: "Sample content",
};

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  topic: NewsTopic;
  category: NewsCategory;
  /** Human-readable place, if the item is about one. */
  location?: string;
  /** Explore state slug; only linked when it exists in the geo index. Never guessed. */
  stateSlug?: string;
  /** ISO date from the source. Absent for demo items. */
  publishedAt?: string;
  source: { name: string; type: SourceType; url?: string };
  imageUrl?: string;
  imageAlt?: string;
  /** Editorial pick for Featured Intelligence. Not a ranking of severity or importance. */
  featured?: boolean;
  /** Factual context only: what the item is about. Never consequences or predictions. */
  context?: { event: string };
}

export type FeedStatus = "live" | "updated" | "demo" | "no_data" | "error";

export interface NewsFeed {
  status: FeedStatus;
  items: NewsItem[];
  /** Timestamp reported by a real feed. Never set for demo data. */
  lastUpdated?: string;
  /** True when `items` came from a cache after a failed refresh. */
  fromCache?: boolean;
}

export const hazardOf = (item: NewsItem): Hazard | undefined => (item.topic === "climate" || item.topic === "resilience" ? undefined : item.topic);

const DEMO_SOURCE = { name: "ClimateResilience demo content", type: "demo" } as const;
const SAMPLE_EVENT = "Sample content. This is not a report of a real event.";

const DEMO_ITEMS: NewsItem[] = [
  {
    id: "sample-assam-monsoon-flooding",
    title: "Sample: Why districts in Assam see repeated monsoon flooding",
    summary:
      "An illustrative briefing on the flood hazard. Assam lies in the Brahmaputra and Barak river valleys, and many districts are on low-lying floodplains that receive heavy monsoon rain. This sample shows how a flood story links to preparedness guidance and the district map.",
    topic: "flood",
    category: "explainer",
    location: "Assam",
    stateSlug: "assam",
    source: DEMO_SOURCE,
    featured: true,
    context: { event: SAMPLE_EVENT },
  },
  {
    id: "sample-east-coast-cyclone-season",
    title: "Sample: How cyclone seasons shape preparedness on the east coast",
    summary:
      "An illustrative briefing on cyclones. Cyclones affecting India's coasts occur most often before and after the monsoon. This sample shows how a cyclone story would connect coastal readers to shelter planning and official instructions.",
    topic: "cyclone",
    category: "explainer",
    location: "Odisha",
    stateSlug: "odisha",
    source: DEMO_SOURCE,
    featured: true,
    context: { event: SAMPLE_EVENT },
  },
  {
    id: "sample-reading-heat-warnings",
    title: "Sample: What to look for in a heat warning",
    summary:
      "An illustrative briefing on heatwaves: what official heat warnings describe, who is more affected by heat, and where to find practical steps to stay cool and hydrated.",
    topic: "heatwave",
    category: "weather",
    location: "India",
    source: DEMO_SOURCE,
    featured: true,
    context: { event: SAMPLE_EVENT },
  },
  {
    id: "sample-western-ghats-landslides",
    title: "Sample: Monsoon rain and landslides in hilly districts",
    summary:
      "An illustrative briefing on landslides. Intense rain on steep slopes, such as those in the Western Ghats, is a common trigger. This sample shows how a landslide story links to warning signs and what to do.",
    topic: "landslide",
    category: "explainer",
    location: "Kerala",
    stateSlug: "kerala",
    source: DEMO_SOURCE,
    context: { event: SAMPLE_EVENT },
  },
  {
    id: "sample-dry-season-forest-fires",
    title: "Sample: Forest fires in the dry season before the monsoon",
    summary:
      "An illustrative briefing on wildfires. Dry vegetation, heat and wind help fires spread in the months before the monsoon. This sample shows how a forest-fire story would point to prevention and evacuation guidance.",
    topic: "wildfire",
    category: "explainer",
    location: "Uttarakhand",
    stateSlug: "uttarakhand",
    source: DEMO_SOURCE,
    context: { event: SAMPLE_EVENT },
  },
  {
    id: "sample-rainfall-deficit-drought",
    title: "Sample: How rainfall deficits develop into drought",
    summary:
      "An illustrative briefing on drought, which builds slowly over weeks or months. This sample shows how a drought story would connect readers to water-saving and livelihood guidance.",
    topic: "drought",
    category: "explainer",
    location: "Rajasthan",
    stateSlug: "rajasthan",
    source: DEMO_SOURCE,
    context: { event: SAMPLE_EVENT },
  },
  {
    id: "sample-lightning-safety-outdoors",
    title: "Sample: Lightning safety for people working outdoors",
    summary:
      "An illustrative briefing on lightning during thunderstorms, and why people in open fields and on water are more exposed. This sample has no single location, so it has no map link.",
    topic: "lightning",
    category: "weather",
    source: DEMO_SOURCE,
    context: { event: SAMPLE_EVENT },
  },
  {
    id: "sample-earthquake-readiness",
    title: "Sample: Earthquake readiness in higher seismic zones",
    summary:
      "An illustrative briefing on earthquakes, which cannot currently be reliably predicted. This sample shows how an earthquake story would point to Drop, Cover and Hold On and to building-safety guidance.",
    topic: "earthquake",
    category: "explainer",
    location: "Himalayan region",
    source: DEMO_SOURCE,
    context: { event: SAMPLE_EVENT },
  },
  {
    id: "sample-island-tsunami-awareness",
    title: "Sample: Natural tsunami warning signs on island coasts",
    summary:
      "An illustrative briefing on tsunamis and the natural signs people on the coast can recognise, such as strong shaking or the sea suddenly pulling back.",
    topic: "tsunami",
    category: "explainer",
    location: "Andaman and Nicobar Islands",
    stateSlug: "andaman-and-nicobar-islands",
    source: DEMO_SOURCE,
    context: { event: SAMPLE_EVENT },
  },
  {
    id: "sample-reading-seasonal-outlooks",
    title: "Sample: Reading a seasonal climate outlook",
    summary:
      "An illustrative climate briefing on what seasonal outlooks describe and how they differ from day-to-day weather forecasts. This is sample content, not an outlook.",
    topic: "climate",
    category: "research",
    location: "India",
    source: DEMO_SOURCE,
    context: { event: SAMPLE_EVENT },
  },
  {
    id: "sample-community-early-action",
    title: "Sample: What community preparedness can look like",
    summary:
      "An illustrative resilience briefing on household and community preparation: emergency kits, knowing safer places, and following official instructions.",
    topic: "resilience",
    category: "explainer",
    location: "India",
    source: DEMO_SOURCE,
    context: { event: SAMPLE_EVENT },
  },
];

/** The only entry point for news. Swap this for a real feed when one exists. */
export function getNewsFeed(): NewsFeed {
  return { status: "demo", items: DEMO_ITEMS };
}

export function getNewsItem(id: string): NewsItem | undefined {
  return getNewsFeed().items.find((i) => i.id === id);
}

export interface NewsFilters {
  query: string;
  topic: NewsTopic | "all";
  location: string | "all";
  category: NewsCategory | "all";
  officialOnly: boolean;
}

export const EMPTY_FILTERS: NewsFilters = { query: "", topic: "all", location: "all", category: "all", officialOnly: false };

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** Client-side search over title, summary, location, source and hazard name. */
export function filterNews(items: readonly NewsItem[], f: NewsFilters): NewsItem[] {
  const terms = norm(f.query).split(/\s+/).filter(Boolean);
  return items.filter((i) => {
    if (f.topic !== "all" && i.topic !== f.topic) return false;
    if (f.location !== "all" && i.location !== f.location) return false;
    if (f.category !== "all" && i.category !== f.category) return false;
    if (f.officialOnly && i.source.type !== "official") return false;
    if (terms.length === 0) return true;
    const hazard = hazardOf(i);
    const haystack = norm([i.title, i.summary, i.location ?? "", i.source.name, topicLabel(i.topic), hazard ? getHazard(hazard).name : ""].join(" "));
    return terms.every((t) => haystack.includes(t));
  });
}

/** Locations present in the data, for the location filter. */
export const locationsOf = (items: readonly NewsItem[]) => [...new Set(items.flatMap((i) => (i.location ? [i.location] : [])))].sort();
