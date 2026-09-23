import { useTranslation } from "react-i18next";
import type { RunSummary } from "@climate/shared";
import { LANGUAGES } from "../i18n";
import { formatDay } from "../lib/format";

export function RunPicker({ runs, value, onChange }: { runs: RunSummary[]; value?: number; onChange: (id: number) => void }) {
  const { t } = useTranslation();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-ink-3">{t("run.label")}</span>
      <select
        className="rounded-md border border-line bg-panel px-2 py-1.5 text-ink focus:outline-2 focus:outline-accent"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {runs.map((r) => (
          <option key={r.id} value={r.id}>
            {r.mode === "live" ? `${t("run.live")} · ${formatDay(r.reference_date)}` : `${t("run.replay")} · ${r.label.replace(/^Replay:\s*/, "")}`}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LanguagePicker() {
  const { i18n } = useTranslation();
  return (
    <div className="flex rounded-md border border-line bg-panel p-0.5 text-sm" role="group" aria-label="Language">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => void i18n.changeLanguage(l.code)}
          aria-pressed={i18n.language === l.code}
          className={`rounded px-2 py-1 ${i18n.language === l.code ? "bg-accent-soft font-semibold text-ink" : "text-ink-2 hover:text-ink"}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function DayStrip({ run, value, onChange }: { run: RunSummary; value?: string; onChange: (d: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-line bg-panel/95 p-1.5 shadow-sm">
      <div className="sr-only">{t("day.label")}</div>
      <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label={t("day.label")}>
        {run.valid_dates.map((d) => {
          const active = d === value;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(d)}
              className={`min-w-16 shrink-0 rounded-md px-2 py-1.5 text-center text-xs leading-tight ${
                active ? "bg-accent text-on-accent" : "text-ink-2 hover:bg-panel-muted"
              }`}
            >
              <div className="font-semibold">{formatDay(d, { weekday: "short" })}</div>
              <div>{formatDay(d, { day: "numeric", month: "short" })}</div>
              {d === run.reference_date && <div className={`text-[10px] ${active ? "text-on-accent/85" : "text-ink-3"}`}>{t("day.today")}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
