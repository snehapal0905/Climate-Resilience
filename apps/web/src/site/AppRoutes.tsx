import { lazy, Suspense, useEffect, useMemo, type ReactNode } from "react";
import HazardsPage from "../hazards/HazardsPage";
import { getHazard, parseHazard } from "../hazards/registry";
import LandingPage from "../landing/LandingPage";
import { Link, usePathname } from "../lib/router";
import { PlaceholderPage } from "./PlaceholderPage";
import { ROUTES, SiteLayout } from "./SiteLayout";

// Loaded on demand so other pages don't download the map and chart libraries.
const AssamFloodWatch = lazy(() => import("../App"));
const ExplorePage = lazy(() => import("../explore/ExplorePage"));
const AmISafePage = lazy(() => import("../safety/AmISafePage"));
const PreparePage = lazy(() => import("../prepare/PreparePage"));
const HazardGuidePage = lazy(() => import("../prepare/HazardGuidePage"));

const pageFallback = <div className="mx-auto min-h-[60vh] max-w-7xl px-4 pt-16 sm:px-6 lg:px-8" />;

const SITE_NAME = "ClimateResilience";

interface Route {
  title: string;
  render: () => ReactNode;
}

const PAGES: Record<string, Route> = {
  [ROUTES.home]: { title: `${SITE_NAME} · India's Climate Risk & Action Platform`, render: () => <LandingPage /> },
  [ROUTES.explore]: {
    title: `Explore India · ${SITE_NAME}`,
    render: () => (
      <Suspense fallback={<div className="mx-auto min-h-[70vh] max-w-7xl px-4 pt-14 text-[15px] text-lp-ink-3 sm:px-6 lg:px-8">Loading map…</div>}>
        <ExplorePage />
      </Suspense>
    ),
  },
  [ROUTES.amISafe]: {
    title: `Am I Safe? · ${SITE_NAME}`,
    render: () => (
      <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-7xl px-4 pt-16 sm:px-6 lg:px-8" />}>
        <AmISafePage />
      </Suspense>
    ),
  },
  [ROUTES.hazards]: {
    title: `Climate Hazards · ${SITE_NAME}`,
    render: () => <HazardsPage />,
  },
  [ROUTES.prepare]: {
    title: `Prepare · ${SITE_NAME}`,
    render: () => (
      <Suspense fallback={pageFallback}>
        <PreparePage />
      </Suspense>
    ),
  },
  [ROUTES.news]: {
    title: `News & Insights · ${SITE_NAME}`,
    render: () => <PlaceholderPage title="Climate & Disaster Intelligence" description="Latest climate and disaster developments will appear here." />,
  },
  [ROUTES.about]: {
    title: `About · ${SITE_NAME}`,
    render: () => <PlaceholderPage eyebrow="About" title="About ClimateResilience" description="India's Climate Risk & Action Platform." />,
  },
};

const NOT_FOUND: Route = {
  title: `Page not found · ${SITE_NAME}`,
  render: () => (
    <PlaceholderPage eyebrow="404" title="Page not found" description="The page you're looking for doesn't exist or has moved.">
      <Link to={ROUTES.home} className="text-[15px] font-medium text-lp-green underline-offset-4 hover:underline">
        Back to home
      </Link>
    </PlaceholderPage>
  ),
};

/** /prepare/:hazard for any hazard in the registry; unknown hazard IDs fall through to 404. */
function prepareGuideRoute(pathname: string): Route | undefined {
  const match = /^\/prepare\/([^/]+)$/.exec(pathname);
  const hazard = parseHazard(match?.[1]);
  if (!hazard) return undefined;
  return {
    title: `${getHazard(hazard).name} Preparedness · ${SITE_NAME}`,
    render: () => (
      <Suspense fallback={pageFallback}>
        <HazardGuidePage key={hazard} hazard={hazard} />
      </Suspense>
    ),
  };
}

export function AppRoutes() {
  const pathname = usePathname();
  const isDashboard = pathname === ROUTES.assam;
  const page = useMemo(() => PAGES[pathname] ?? prepareGuideRoute(pathname) ?? NOT_FOUND, [pathname]);

  // The site pages use the light landing theme on <html>/<body>; the dashboard keeps its own theme.
  useEffect(() => {
    document.documentElement.classList.toggle("lp-root", !isDashboard);
    document.title = isDashboard ? "Assam Flood Watch" : page.title;
  }, [isDashboard, page]);

  if (isDashboard) {
    return (
      <Suspense fallback={null}>
        <AssamFloodWatch />
      </Suspense>
    );
  }
  return <SiteLayout>{page.render()}</SiteLayout>;
}
