import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RISK_LEVEL_META, RISK_LEVELS, type RiskSummary } from "@climate/shared";
import { ApiError, locateRegion } from "../lib/api";
import { formatDay } from "../lib/format";
import { RiskBadge, RiskIcon } from "./RiskBadge";

export function SummaryPanel({ summary, onSelect }: { summary: RiskSummary; onSelect: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <LocateButton onFound={onSelect} />

      {summary.valid_for && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink-2">
            {t("summary.title", { date: formatDay(summary.valid_for, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) })}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[...RISK_LEVELS].reverse().map((l) => (
              <div key={l} className="rounded-lg border border-line bg-panel p-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-ink-2">
                  <span style={{ color: RISK_LEVEL_META[l].color }}>
                    <RiskIcon level={l} />
                  </span>
                  {t(`risk.${l}`)}
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-ink">{summary.counts[l]}</div>
                <div className="text-xs text-ink-3">{t("summary.districts", { count: summary.counts[l] })}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {summary.top_regions.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink-2">{t("summary.top")}</h2>
          <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel">
            {summary.top_regions.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelect(r.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-panel-muted"
                >
                  <span className="font-medium text-ink">{r.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm tabular-nums text-ink-3">{Math.round(r.risk_score * 100)}%</span>
                    <RiskBadge level={r.risk_level} />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="text-sm text-ink-3">{t("summary.hint")}</p>
    </div>
  );
}

function LocateButton({ onFound }: { onFound: (id: string) => void }) {
  const { t } = useTranslation();
  const [state, setState] = useState<"idle" | "locating" | "denied" | "unsupported" | "outside">("idle");

  const locate = () => {
    if (!("geolocation" in navigator)) return setState("unsupported");
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const region = await locateRegion(pos.coords.latitude, pos.coords.longitude);
          setState("idle");
          onFound(region.id);
        } catch (err) {
          setState(err instanceof ApiError && err.status === 404 ? "outside" : "unsupported");
        }
      },
      () => setState("denied"),
      { timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <div>
      <button
        type="button"
        onClick={locate}
        disabled={state === "locating"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-semibold text-on-accent hover:opacity-90 disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        {state === "locating" ? t("locate.locating") : t("locate.button")}
      </button>
      {state !== "idle" && state !== "locating" && (
        <p className="mt-2 text-sm text-ink-2" role="status">
          {t(`locate.${state}`)}
        </p>
      )}
    </div>
  );
}
