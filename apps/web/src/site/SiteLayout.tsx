/**
 * Shared chrome for the ClimateResilience site: header with global navigation, mobile menu and footer.
 * (The Assam Flood Watch dashboard keeps its own header and is not wrapped in this layout.)
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link, usePathname } from "../lib/router";

export const ROUTES = {
  home: "/",
  explore: "/explore",
  assam: "/assam-flood-watch",
  hazards: "/hazards",
  prepare: "/prepare",
  news: "/news",
  about: "/about",
} as const;

const NAV: ReadonlyArray<{ label: string; to: string }> = [
  { label: "Platform", to: ROUTES.home },
  { label: "Risk Map", to: ROUTES.explore },
  { label: "Hazards", to: ROUTES.hazards },
  { label: "Prepare", to: ROUTES.prepare },
  { label: "News & Insights", to: ROUTES.news },
];
const MOBILE_NAV = [...NAV, { label: "About", to: ROUTES.about }];

/** Placeholder for navigation that isn't built yet: visibly a link, but inert. */
export function Soon({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <a aria-disabled="true" title="Coming soon" className={`cursor-default ${className}`}>
      {children}
    </a>
  );
}

function Brand() {
  return (
    <Link to={ROUTES.home} className="group flex items-center gap-2.5" aria-label="ClimateResilience home">
      <svg className="h-8 w-8 shrink-0 text-lp-green" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.5 12.5c3.8 2 7.6 2 11.5 0s7.7-2 11.5 0M3.5 18c4.1 2 8.3 2 12.5 0s8.4-2 12.5 0M7 23.5c3 1.4 6 1.4 9 0s6-1.4 9 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="leading-tight">
        <span className="block text-[17px] font-semibold tracking-tight text-lp-ink">
          Climate<span className="text-lp-green">Resilience</span>
        </span>
        <span className="block text-[11px] text-lp-ink-3">India's Climate Risk &amp; Action Platform</span>
      </span>
    </Link>
  );
}

export function PrimaryButton({ to, children, className = "", inverted = false }: { to: string; children: ReactNode; className?: string; inverted?: boolean }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${
        inverted
          ? "bg-white text-lp-green hover:bg-lp-green-soft focus-visible:outline-white"
          : "bg-lp-green text-white hover:bg-lp-green-deep focus-visible:outline-lp-green"
      } ${className}`}
    >
      {children}
      <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function GlobeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.7 8h12.6M8 1.7c1.7 1.8 2.5 3.9 2.5 6.3S9.7 12.5 8 14.3M8 1.7C6.3 3.5 5.5 5.6 5.5 8s.8 4.5 2.5 6.3" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on any route change (including back/forward) and when resizing to desktop.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    mq.addEventListener("change", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const navLink = "text-[14px] text-lp-ink-2 transition-colors hover:text-lp-ink";

  return (
    <header className="sticky top-0 z-30 border-b border-lp-line/70 bg-lp-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Brand />

        <nav className="hidden h-full items-stretch gap-7 lg:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center text-[14px] transition-colors ${active ? "text-lp-ink" : "text-lp-ink-2 hover:text-lp-ink"}`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-lp-green transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <Soon className={`${navLink} flex items-center gap-1.5`}>
            <GlobeIcon />
            English
          </Soon>
          <Soon className={navLink}>Login</Soon>
          <Link
            to={ROUTES.explore}
            className="rounded-full bg-lp-green px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-lp-green-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-green"
          >
            Explore India
          </Link>
        </div>

        <button
          type="button"
          className="-mr-2 rounded-md p-2 text-lp-ink lg:hidden"
          aria-expanded={open}
          aria-controls="lp-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div id="lp-mobile-nav" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-lp-line bg-lp-bg px-4 pb-6 pt-2 sm:px-6 lg:hidden">
          <nav className="flex flex-col" aria-label="Main">
            {MOBILE_NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 border-b border-lp-line py-3 text-[16px] ${active ? "font-medium text-lp-green" : "text-lp-ink"}`}
                >
                  <span className={`h-4 w-[2px] rounded-full ${active ? "bg-lp-green" : "bg-transparent"}`} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
            <div className="flex gap-6 py-3 pl-[14px] text-[15px] text-lp-ink-3">
              <Soon className="flex items-center gap-1.5">
                <GlobeIcon />
                English
              </Soon>
              <Soon>Login</Soon>
            </div>
          </nav>
          <Link
            to={ROUTES.explore}
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-full bg-lp-green px-4 py-3 text-center text-[15px] font-medium text-white"
          >
            Explore India
          </Link>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const columns: ReadonlyArray<{ title: string; links: ReadonlyArray<{ label: string; to?: string }> }> = [
    {
      title: "Product",
      links: [
        { label: "Platform", to: ROUTES.home },
        { label: "Risk Map", to: ROUTES.explore },
        { label: "Hazards", to: ROUTES.hazards },
        { label: "Prepare", to: ROUTES.prepare },
      ],
    },
    { title: "Company", links: [{ label: "News", to: ROUTES.news }, { label: "About", to: ROUTES.about }] },
    { title: "Legal", links: [{ label: "Privacy" }, { label: "Terms" }] },
  ];
  const link = "text-[14px] text-lp-ink-2 transition-colors hover:text-lp-ink";
  return (
    <footer className="border-t border-lp-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_2fr] lg:px-8">
        <div>
          <Brand />
          <Soon className="mt-6 inline-flex items-center gap-2 rounded-full border border-lp-line px-3 py-1.5 text-[13px] font-medium text-lp-ink">
            <span className="h-2 w-2 rounded-full bg-[#d03b3b]" aria-hidden="true" />
            Emergency
          </Soon>
          <p className="mt-4 text-[13px] text-lp-ink-3">In an emergency, call 112. Disaster helpline 1070.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((c) => (
            <div key={c.title}>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-lp-ink-3">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className={link}>
                        {l.label}
                      </Link>
                    ) : (
                      <Soon className={link}>{l.label}</Soon>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-lp-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-[12.5px] text-lp-ink-3 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} ClimateResilience. Prototype for research and demonstration.</p>
          <p>Boundaries: Census 2011 districts. Illustrations are not live data.</p>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lp flex min-h-full flex-col bg-lp-bg font-lp-sans text-lp-ink antialiased">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-lp-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
