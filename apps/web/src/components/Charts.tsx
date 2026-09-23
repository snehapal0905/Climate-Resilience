/**
 * Region charts. Each measure gets its own chart and its own axis (no dual axes).
 * Risk bars use the reserved status colours and always carry a text label in the tooltip.
 */
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RISK_LEVEL_META, type DailyWeather, type RiskPoint } from "@climate/shared";
import { formatDay, formatNumber } from "../lib/format";

const axisTick = { fill: "var(--ink-3)", fontSize: 11 };
const tooltipStyle = {
  contentStyle: {
    background: "var(--panel)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--ink)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--ink)", fontWeight: 600 },
  itemStyle: { color: "var(--ink-2)" },
};
const shortDay = (d: string) => formatDay(d, { day: "numeric", month: "short" });

export function RiskOutlookChart({ timeline, selectedDate, onSelectDate }: { timeline: RiskPoint[]; selectedDate?: string; onSelectDate: (d: string) => void }) {
  const { t } = useTranslation();
  const data = timeline.map((p) => ({ ...p, pct: Math.round(p.risk_score * 100) }));
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="valid_for" tickFormatter={(d: string) => formatDay(d, { weekday: "short" })} tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v: number) => `${v}%`} tick={axisTick} axisLine={false} tickLine={false} />
        <Tooltip
          {...tooltipStyle}
          cursor={{ fill: "var(--panel-muted)" }}
          labelFormatter={(d) => formatDay(String(d), { weekday: "long", day: "numeric", month: "long" })}
          formatter={(v, _n, item) => [`${v}% · ${t(`risk.${(item.payload as RiskPoint).risk_level}`)}`, t("region.score")]}
        />
        <Bar dataKey="pct" radius={[4, 4, 0, 0]} onClick={(d) => onSelectDate(String((d as unknown as { valid_for: string }).valid_for))} className="cursor-pointer">
          {data.map((p) => (
            <Cell
              key={p.valid_for}
              fill={RISK_LEVEL_META[p.risk_level].color}
              // Outline rather than fade the selected day: fading would make a severe bar read as "high".
              stroke={p.valid_for === selectedDate ? "var(--ink)" : "none"}
              strokeWidth={2}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RainfallChart({ weather, referenceDate }: { weather: DailyWeather[]; referenceDate: string }) {
  const { t } = useTranslation();
  return (
    <div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={weather} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="date" tickFormatter={shortDay} tick={axisTick} axisLine={false} tickLine={false} minTickGap={16} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} />
          <ReferenceLine x={referenceDate} stroke="var(--ink-3)" strokeDasharray="3 3" />
          <Tooltip
            {...tooltipStyle}
            cursor={{ fill: "var(--panel-muted)" }}
            labelFormatter={(d) => formatDay(String(d))}
            formatter={(v, _n, item) => [
              v == null ? "—" : `${formatNumber(Number(v), 1)} mm`,
              (item.payload as DailyWeather).is_forecast ? t("region.forecast") : t("region.observed"),
            ]}
          />
          <Bar dataKey="precipitation_mm" radius={[4, 4, 0, 0]}>
            {weather.map((w) => (
              <Cell key={w.date} fill="var(--chart-series)" fillOpacity={w.is_forecast ? 0.4 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ObservedForecastKey />
    </div>
  );
}

export function DischargeChart({ weather, referenceDate }: { weather: DailyWeather[]; referenceDate: string }) {
  const { t } = useTranslation();
  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={weather} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="date" tickFormatter={shortDay} tick={axisTick} axisLine={false} tickLine={false} minTickGap={16} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatNumber(v)} />
        <ReferenceLine x={referenceDate} stroke="var(--ink-3)" strokeDasharray="3 3" />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(d) => formatDay(String(d))}
          formatter={(v, _n, item) => [
            v == null ? "—" : `${formatNumber(Number(v), 1)} m³/s`,
            (item.payload as DailyWeather).is_forecast ? t("region.forecast") : t("region.observed"),
          ]}
        />
        <Line type="monotone" dataKey="river_discharge_m3s" stroke="var(--chart-series)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ObservedForecastKey() {
  const { t } = useTranslation();
  return (
    <div className="mt-1 flex gap-4 text-xs text-ink-3">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--chart-series)" }} />
        {t("region.observed")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm opacity-40" style={{ background: "var(--chart-series)" }} />
        {t("region.forecast")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 border-t border-dashed border-ink-3" />
        {t("day.today")}
      </span>
    </div>
  );
}
