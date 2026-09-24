/** Small presentational pieces shared by every place that shows a hazard. */
import { HazardIcon } from "./HazardIcon";
import { getHazard, type HazardStatus } from "./registry";
import type { Hazard } from "@climate/shared";

/** Icon on a soft tile in the hazard's identity colour. */
export function HazardTile({ hazard, size = "md" }: { hazard: Hazard; size?: "sm" | "md" | "lg" }) {
  const { color } = getHazard(hazard);
  const box = size === "lg" ? "h-14 w-14 rounded-xl" : size === "sm" ? "h-7 w-7 rounded-md" : "h-11 w-11 rounded-lg";
  const icon = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${box}`} style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
      <HazardIcon hazard={hazard} className={icon} />
    </span>
  );
}

/** Text + icon badge, so status never depends on colour alone. */
export function HazardStatusBadge({ status, compact = false }: { status: HazardStatus; compact?: boolean }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border font-medium ${compact ? "px-1.5 py-px text-[11px]" : "px-2 py-0.5 text-[12px]"} ${
        active ? "border-lp-green/30 bg-lp-green-soft text-lp-green" : "border-lp-line-strong bg-lp-bg text-lp-ink-3"
      }`}
    >
      <svg className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {active ? (
          <path d="m3.5 8.5 3 3 6-6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 5v3.2l2 1.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </>
        )}
      </svg>
      {active ? "Active" : compact ? "Soon" : "Coming soon"}
    </span>
  );
}
