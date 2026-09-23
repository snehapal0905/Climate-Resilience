/** Line icons for the hazards shown on the landing page (24×24, stroke = currentColor). */
import type { ReactNode } from "react";
export type HazardKey = "flood" | "heatwave" | "cyclone" | "drought" | "landslide" | "wildfire" | "lightning" | "earthquake";

const PATHS: Record<HazardKey, ReactNode> = {
  flood: (
    <>
      <path d="M12 3.5c2.6 3.1 4.2 5.4 4.2 7.4a4.2 4.2 0 0 1-8.4 0c0-2 1.6-4.3 4.2-7.4Z" />
      <path d="M3 17.5c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0" />
      <path d="M3 21c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0" />
    </>
  ),
  heatwave: (
    <>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M12 2v1.5M12 14.5V16M5 9H3.5M20.5 9H19M7 4l1 1M17 4l-1 1" />
      <path d="M4 19.5c1.3-1 2.7-1 4 0s2.7 1 4 0 2.7-1 4 0 2.7 1 4 0" />
    </>
  ),
  cyclone: (
    <>
      <path d="M20 7.5C17.5 5 14.9 4 12 4a8 8 0 0 0-8 8" />
      <path d="M4 16.5C6.5 19 9.1 20 12 20a8 8 0 0 0 8-8" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  drought: (
    <>
      <circle cx="17" cy="6.5" r="2.5" />
      <path d="M3 14h18" />
      <path d="M6 14l2 3-1.5 3M12 14l-1.5 2.5L13 20M17 14l1 2.5-2 3.5" />
    </>
  ),
  landslide: (
    <>
      <path d="M3 20h18L9 6 3 13" />
      <circle cx="16.5" cy="10.5" r="1.5" />
      <circle cx="19.5" cy="14.5" r="1" />
      <path d="M12 6.5l1.5-2" />
    </>
  ),
  wildfire: (
    <>
      <path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.8 3.4-5.6 3.8-9.4 2.5 1.5 3.7 3.7 3.4 6 1-.4 1.8-1.4 2.1-2.6 1.7 1.6 2.7 3.6 2.7 6 0 3.2-2.4 5.6-6 5.6Z" />
      <path d="M12 21c-1.4 0-2.4-1-2.4-2.4 0-1.6 1.4-2.3 2.4-3.8 1 1.5 2.4 2.2 2.4 3.8 0 1.4-1 2.4-2.4 2.4Z" />
    </>
  ),
  lightning: (
    <>
      <path d="M7 10.5a4.5 4.5 0 0 1 .9-8.9A5.5 5.5 0 0 1 18.5 4a3.5 3.5 0 0 1-.5 7" />
      <path d="M12.5 9 9.5 15h4l-2.5 6" />
    </>
  ),
  earthquake: (
    <>
      <path d="M2 12h4l2-5 3 11 3-14 2.5 8H22" />
    </>
  ),
};

export function HazardIcon({ hazard, className = "h-5 w-5" }: { hazard: HazardKey; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[hazard]}
    </svg>
  );
}
