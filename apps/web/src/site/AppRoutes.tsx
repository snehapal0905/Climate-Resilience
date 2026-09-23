import { lazy, Suspense, useEffect, type ReactNode } from "react";
import LandingPage from "../landing/LandingPage";
import { Link, usePathname } from "../lib/router";
import { AssamLiveLink, PlaceholderPage } from "./PlaceholderPage";
import { ROUTES, SiteLayout } from "./SiteLayout";

// Loaded on demand so other pages don't download the map and chart libraries.
const AssamFloodWatch = lazy(() => import("../App"));

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
      <PlaceholderPage title="Explore India" description="India-wide climate risk intelligence is coming here.">
        <AssamLiveLink />
      </PlaceholderPage>
    ),
  },
  [ROUTES.hazards]: {
    title: `Climate Hazards · ${SITE_NAME}`,
    render: () => <PlaceholderPage title="Climate Hazards" description="Explore climate and disaster risks across India." />,
  },
  [ROUTES.prepare]: {
    title: `Prepare · ${SITE_NAME}`,
    render: () => <PlaceholderPage title="Prepare" description="Practical guidance for before, during and after disasters." />,
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

export function AppRoutes() {
  const pathname = usePathname();
  const isDashboard = pathname === ROUTES.assam;
  const page = PAGES[pathname] ?? NOT_FOUND;

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
