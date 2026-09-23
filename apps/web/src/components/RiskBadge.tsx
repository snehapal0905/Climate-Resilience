import { useTranslation } from "react-i18next";
import { RISK_LEVEL_META, type RiskLevel } from "@climate/shared";

/** Status icon per level, so risk is never communicated by colour alone. */
export function RiskIcon({ level, className = "h-4 w-4" }: { level: RiskLevel; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, "aria-hidden": true };
  switch (level) {
    case "low":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "moderate":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6M12 16.5v.5" strokeLinecap="round" />
        </svg>
      );
    case "high":
      return (
        <svg {...common}>
          <path d="M12 3 2 20h20L12 3Z" strokeLinejoin="round" />
          <path d="M12 10v4M12 17v.5" strokeLinecap="round" />
        </svg>
      );
    case "severe":
      return (
        <svg {...common}>
          <path d="M8 2.5h8L21.5 8v8L16 21.5H8L2.5 16V8L8 2.5Z" strokeLinejoin="round" />
          <path d="M12 7.5v5M12 16v.5" strokeLinecap="round" />
        </svg>
      );
  }
}

export function RiskBadge({ level, size = "md" }: { level: RiskLevel; size?: "md" | "lg" }) {
  const { t } = useTranslation();
  const color = RISK_LEVEL_META[level].color;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold text-ink ${
        size === "lg" ? "px-3 py-1 text-base" : "px-2 py-0.5 text-xs"
      }`}
      style={{ borderColor: color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      <span style={{ color }}>
        <RiskIcon level={level} className={size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"} />
      </span>
      {t(`risk.${level}`)}
    </span>
  );
}
