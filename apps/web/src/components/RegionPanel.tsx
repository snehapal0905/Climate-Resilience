import { useTranslation } from "react-i18next";
import type { RegionDetail } from "@climate/shared";
import { formatDay } from "../lib/format";
import { DischargeChart, RainfallChart, RiskOutlookChart } from "./Charts";
import { RiskBadge } from "./RiskBadge";

interface Props {
  region: RegionDetail;
  date?: string;
  onBack: () => void;
  onSelectDate: (d: string) => void;
}

export function RegionPanel({ region, date, onBack, onSelectDate }: Props) {
  const { t } = useTranslation();
  const point = region.risk_timeline.find((p) => p.valid_for === date) ?? region.risk_timeline[0];
  const maxImpact = Math.max(...(point?.top_factors.map((f) => f.impact) ?? [0]), 0.0001);
  const advice = point ? (t(`advice.${point.risk_level}`, { returnObjects: true }) as string[]) : [];

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-accent hover:underline">
        <span aria-hidden>←</span> {t("region.back")}
      </button>

      <header>
        <h2 className="text-2xl font-semibold text-ink">{region.name}</h2>
        {point ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <RiskBadge level={point.risk_level} size="lg" />
            <span className="text-sm text-ink-2">
              {t("region.riskOn", { date: formatDay(point.valid_for, { weekday: "long", day: "numeric", month: "long" }) })} ·{" "}
              {t("region.score")} <span className="font-semibold tabular-nums text-ink">{Math.round(point.risk_score * 100)}%</span>
            </span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-3">{t("region.noPrediction")}</p>
        )}
      </header>

      {advice.length > 0 && (
        <section className="rounded-lg border border-line bg-panel p-4">
          <h3 className="mb-2 font-semibold text-ink">{t("region.advice")}</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-2">
            {advice.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      {point && point.top_factors.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-ink-2">{t("region.why")}</h3>
          <ul className="space-y-2">
            {point.top_factors.map((f) => (
              <li key={f.feature} className="text-sm">
                <div className="mb-1 text-ink">{t(`features.${f.feature}`, { defaultValue: f.feature })}</div>
                <div className="h-2 overflow-hidden rounded-full bg-panel-muted">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, (f.impact / maxImpact) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {region.risk_timeline.length > 0 && (
        <section>
          <h3 className="mb-1 text-sm font-semibold text-ink-2">{t("region.outlook")}</h3>
          <RiskOutlookChart timeline={region.risk_timeline} selectedDate={point?.valid_for} onSelectDate={onSelectDate} />
        </section>
      )}

      {region.run && region.weather.length > 0 && (
        <>
          <section>
            <h3 className="mb-1 text-sm font-semibold text-ink-2">{t("region.rainfall")}</h3>
            <RainfallChart weather={region.weather} referenceDate={region.run.reference_date} />
          </section>
          <section>
            <h3 className="mb-1 text-sm font-semibold text-ink-2">{t("region.discharge")}</h3>
            <DischargeChart weather={region.weather} referenceDate={region.run.reference_date} />
          </section>
        </>
      )}
    </div>
  );
}
