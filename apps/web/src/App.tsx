import { useTranslation } from "react-i18next";
import { useRegion, useRiskMap, useRiskSummary, useRuns } from "./lib/api";
import { formatDay } from "./lib/format";
import { useViewState } from "./lib/urlState";
import { DayStrip, LanguagePicker, RunPicker } from "./components/Controls";
import { RegionPanel } from "./components/RegionPanel";
import { RiskMap } from "./components/RiskMap";
import { SummaryPanel } from "./components/SummaryPanel";

export default function App() {
  const { t } = useTranslation();
  const [view, setView] = useViewState();
  const runs = useRuns();
  const map = useRiskMap(view.run, view.date);
  const summary = useRiskSummary(view.run, view.date);
  const region = useRegion(view.region, view.run);

  // The server resolves defaults (latest live run, run date); reflect what it chose.
  const run = map.data?.run ?? null;
  const date = map.data?.valid_for ?? undefined;
  const error = runs.error ?? map.error ?? summary.error;

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel px-4 py-3">
        <div className="flex items-center gap-3">
          <svg className="h-8 w-8 text-accent" viewBox="0 0 32 32" fill="none" aria-hidden>
            <path d="M16 3c5 6 9 10.5 9 15a9 9 0 0 1-18 0c0-4.5 4-9 9-15Z" fill="currentColor" opacity=".2" />
            <path d="M16 3c5 6 9 10.5 9 15a9 9 0 0 1-18 0c0-4.5 4-9 9-15Z" stroke="currentColor" strokeWidth="2" />
            <path d="M10.5 20c1.8 1.4 3.6 1.4 5.5 0s3.7-1.4 5.5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-ink">{t("app.title")}</h1>
            <p className="text-sm text-ink-3">{t("app.subtitle")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {runs.data && runs.data.length > 0 && (
            <RunPicker runs={runs.data} value={run?.id} onChange={(id) => setView({ run: id, date: undefined })} />
          )}
          <LanguagePicker />
        </div>
      </header>

      {run?.mode === "replay" && (
        <div className="border-b border-line bg-accent-soft px-4 py-2 text-sm text-ink" role="note">
          {t("run.replayBanner", { date: formatDay(run.reference_date, { day: "numeric", month: "long", year: "numeric" }) })}
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative h-[55vh] shrink-0 lg:h-auto lg:flex-1">
          <RiskMap data={map.data} selected={view.region} onSelect={(id) => setView({ region: id })} />
          {run && (
            <div className="absolute left-3 top-3 max-w-[calc(100%-4.5rem)]">
              <DayStrip run={run} value={date} onChange={(d) => setView({ date: d })} />
            </div>
          )}
        </div>

        <aside className="min-h-0 overflow-y-auto border-line bg-surface p-4 lg:w-[420px] lg:border-l">
          {error ? (
            <p className="rounded-lg border border-line bg-panel p-4 text-sm text-ink-2" role="alert">
              {error.message}
            </p>
          ) : !runs.isLoading && runs.data?.length === 0 ? (
            <p className="rounded-lg border border-line bg-panel p-4 text-sm text-ink-2">{t("run.none")}</p>
          ) : view.region && region.data ? (
            <RegionPanel
              region={region.data}
              date={date}
              onBack={() => setView({ region: undefined })}
              onSelectDate={(d) => setView({ date: d })}
            />
          ) : summary.data ? (
            <SummaryPanel summary={summary.data} onSelect={(id) => setView({ region: id })} />
          ) : (
            <div className="space-y-3" aria-busy>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-panel-muted" />
              ))}
            </div>
          )}

          <footer className="mt-6 space-y-1 border-t border-line pt-3 text-xs text-ink-3">
            <p className="font-medium text-ink-2">{t("app.helplines")}</p>
            <p>{t("app.disclaimer")}</p>
            {run && (
              <p>
                {t("run.model")}: {run.model_version}
              </p>
            )}
          </footer>
        </aside>
      </main>
    </div>
  );
}
