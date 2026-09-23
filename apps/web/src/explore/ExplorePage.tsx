/**
 * /explore — India → state → district drill-down over the risk API.
 * Boundaries come from static files (./geo); risk comes only from the existing risk API, so regions
 * without a model are always shown as "no data", never as low risk.
 */
import { useMemo, useState, type ReactNode } from "react";
import { NO_DATA_COLOR, RISK_LEVEL_META, RISK_LEVELS, type RiskLevel } from "@climate/shared";
import { useRiskMap, useRuns } from "../lib/api";
import { formatDay } from "../lib/format";
import { Breadcrumbs, DateSelect, HazardSelect, LocationSearch, type Crumb, type SearchHit } from "./ExploreControls";
import { ExploreMap, type HoverInfo, type RiskRegionsCollection } from "./ExploreMap";
import { countLevels, DistrictPanel, IndiaPanel, StatePanel, type CoverageRow, type RiskRegion, type RiskStatus } from "./ExplorePanels";
import { useExploreSelection } from "./exploreState";
import { INDIA_BBOX, normalizeName, useDistrictsGeo, useGeoIndex, useStatesGeo, type BBox } from "./geo";
import { DEFAULT_HAZARD } from "./hazards";

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-lp-line bg-lp-surface/95 px-3 py-2.5 text-[12.5px] shadow-sm">
      <p className="mb-1.5 font-semibold text-lp-ink">Flood risk</p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-1">
        {[...RISK_LEVELS].map((l) => (
          <li key={l} className="flex items-center gap-2 text-lp-ink-2">
            <span className="h-3 w-3 rounded-sm" style={{ background: RISK_LEVEL_META[l].color }} aria-hidden="true" />
            {RISK_LEVEL_META[l].label}
          </li>
        ))}
        <li className="flex items-center gap-2 text-lp-ink-2">
          <span className="lp-hatch-swatch h-3 w-3 rounded-sm border" style={{ borderColor: NO_DATA_COLOR, backgroundColor: `${NO_DATA_COLOR}33` }} aria-hidden="true" />
          No data
        </li>
      </ul>
    </div>
  );
}

function MapStatus({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warning" }) {
  return (
    <div
      role="status"
      className={`pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] shadow-sm ${
        tone === "warning" ? "border-[#ec835a]/50 bg-lp-surface text-lp-ink" : "border-lp-line bg-lp-surface/95 text-lp-ink-2"
      }`}
    >
      {children}
    </div>
  );
}

export default function ExplorePage() {
  const [sel, setSel] = useExploreSelection();
  const [refocus, setRefocus] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  const runs = useRuns();
  const statesGeo = useStatesGeo();
  const index = useGeoIndex();
  const risk = useRiskMap(sel.run, sel.date);

  // The run/date the server actually resolved (defaults to the latest live run and its first day).
  const run = risk.data?.run ?? null;
  const date = risk.data?.valid_for ?? undefined;
  const riskStatus: RiskStatus = risk.isError ? "error" : risk.data ? "ready" : "loading";

  const stateBySlug = useMemo(() => new Map(index.data?.states.map((s) => [s.slug, s])), [index.data]);
  const stateSlugByName = useMemo(() => new Map(index.data?.states.map((s) => [normalizeName(s.name), s.slug])), [index.data]);

  /** Model regions from the risk API, tagged with the state/district slugs used in URLs. */
  const riskRegions = useMemo<RiskRegion[]>(() => {
    if (!risk.data || !index.data || risk.isError) return [];
    return risk.data.features.flatMap((f) => {
      const stateSlug = stateSlugByName.get(normalizeName(f.properties.state));
      if (!stateSlug) return [];
      const match = index.data.districts.find((d) => d.state === stateSlug && normalizeName(d.name) === normalizeName(f.properties.name));
      return [
        {
          id: f.properties.id,
          name: f.properties.name,
          state_slug: stateSlug,
          district_slug: match?.slug ?? normalizeName(f.properties.name).replace(/ /g, "-"),
          risk_level: f.properties.risk_level,
          risk_score: f.properties.risk_score,
        },
      ];
    });
  }, [risk.data, risk.isError, index.data, stateSlugByName]);

  const riskCollection = useMemo<RiskRegionsCollection | undefined>(() => {
    if (!risk.data || risk.isError) return undefined;
    const byId = new Map(riskRegions.map((r) => [r.id, r]));
    return {
      type: "FeatureCollection",
      features: risk.data.features.flatMap((f) => {
        const r = byId.get(f.properties.id);
        return r ? [{ type: "Feature" as const, id: r.id, geometry: f.geometry, properties: r }] : [];
      }),
    };
  }, [risk.data, risk.isError, riskRegions]);

  const statesWithData = useMemo(() => [...new Set(riskRegions.map((r) => r.state_slug))].sort(), [riskRegions]);

  const selectedState = sel.state ? stateBySlug.get(sel.state) : undefined;
  const stateHasData = !!selectedState && statesWithData.includes(selectedState.slug);
  const stateRegions = useMemo(() => riskRegions.filter((r) => r.state_slug === selectedState?.slug), [riskRegions, selectedState]);
  const stateDistricts = useMemo(() => index.data?.districts.filter((d) => d.state === selectedState?.slug) ?? [], [index.data, selectedState]);
  // Static district boundaries are only needed for states the risk API doesn't cover.
  const districtsGeo = useDistrictsGeo(selectedState?.slug, !!selectedState && riskStatus !== "loading" && !stateHasData);

  const selectedDistrict = selectedState && sel.district ? stateDistricts.find((d) => d.slug === sel.district) : undefined;
  const selectedRegion = selectedDistrict ? stateRegions.find((r) => r.district_slug === selectedDistrict.slug) : undefined;

  const focus: BBox | undefined = !index.data ? undefined : selectedDistrict?.bbox ?? selectedState?.bbox ?? INDIA_BBOX;

  const coverage = useMemo<CoverageRow[]>(
    () =>
      statesWithData.flatMap((slug) => {
        const state = stateBySlug.get(slug);
        if (!state) return [];
        const regions = riskRegions.filter((r) => r.state_slug === slug);
        const total = index.data?.districts.filter((d) => d.state === slug).length ?? regions.length;
        return [{ state, regions: regions.length, counts: countLevels(regions, total) }];
      }),
    [statesWithData, stateBySlug, riskRegions, index.data],
  );

  // Navigation keeps the chosen run/date and resets deeper levels.
  const keep = { run: sel.run, date: sel.date };
  const goIndia = () => setSel(keep);
  const goState = (slug: string) => setSel({ ...keep, state: slug });
  const goDistrict = (state: string, district: string) => setSel({ ...keep, state, district });

  const onPick = (stateSlug: string, districtSlug: string | undefined) => {
    if (stateSlug !== selectedState?.slug) goState(stateSlug);
    else if (districtSlug) goDistrict(stateSlug, districtSlug);
  };

  const describe = (stateSlug: string, districtSlug: string | undefined): HoverInfo => {
    const state = stateBySlug.get(stateSlug);
    const region = districtSlug ? riskRegions.find((r) => r.state_slug === stateSlug && r.district_slug === districtSlug) : undefined;
    if (region) {
      const level = region.risk_level ? `${RISK_LEVEL_META[region.risk_level as RiskLevel].label} (${Math.round((region.risk_score ?? 0) * 100)}%)` : "No prediction for this date";
      return { title: `${region.name}, ${state?.name ?? ""}`, detail: `Flood risk: ${level}` };
    }
    if (districtSlug && stateSlug === selectedState?.slug) {
      const d = stateDistricts.find((x) => x.slug === districtSlug);
      return { title: d?.name ?? districtSlug, detail: "No flood data yet" };
    }
    const hasData = statesWithData.includes(stateSlug);
    return { title: state?.name ?? stateSlug, detail: hasData ? "Flood forecasts available" : riskStatus === "loading" ? "Loading risk data…" : "No flood data yet" };
  };

  const onSearch = (hit: SearchHit) => (hit.district ? goDistrict(hit.state, hit.district) : goState(hit.state));

  const crumbs: Crumb[] = [{ label: "India", onClick: selectedState ? goIndia : () => setRefocus((n) => n + 1) }];
  if (selectedState) crumbs.push({ label: selectedState.name, onClick: selectedDistrict ? () => goState(selectedState.slug) : () => setRefocus((n) => n + 1) });
  if (selectedState && selectedDistrict) crumbs.push({ label: selectedDistrict.name, onClick: () => setRefocus((n) => n + 1) });

  const geoError = statesGeo.isError || index.isError;
  const geoLoading = !geoError && (statesGeo.isLoading || index.isLoading || !mapReady);
  const invalidSelection = !!index.data && ((sel.state && !selectedState) || (selectedState && sel.district && !selectedDistrict));

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 sm:pt-14 lg:px-8">
      <header className="max-w-3xl">
        <p className="mb-3 hidden text-[12px] font-medium uppercase tracking-[0.14em] text-lp-green sm:block">Risk map</p>
        <h1 className="font-lp-display text-[30px] leading-[1.08] tracking-[-0.02em] text-lp-ink sm:text-[48px]">Explore India's Climate Risk</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-lp-ink-2 sm:mt-3 sm:text-[17px]">Explore climate and disaster risk across states and districts.</p>
      </header>

      <div className="mt-5 flex items-end gap-3 border-y border-lp-line py-3 sm:mt-8 sm:justify-between sm:gap-4 sm:py-4">
        <HazardSelect value={DEFAULT_HAZARD} />
        <DateSelect runs={runs.data} loading={runs.isLoading} runId={run?.id} date={date} onChange={(r, d) => setSel({ state: sel.state, district: sel.district, run: r, date: d })} />
      </div>

      {run?.mode === "replay" && (
        <p className="mt-4 rounded-lg border border-lp-line bg-lp-sand/60 px-4 py-2.5 text-[14px] text-lp-ink" role="note">
          Viewing a replay of past data ({formatDay(run.reference_date, { day: "numeric", month: "long", year: "numeric" })}). This is not a current forecast.
        </p>
      )}

      <div className="mt-4 flex flex-col-reverse gap-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumbs items={crumbs} />
        <LocationSearch index={index.data} onSelect={onSearch} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="lp-explore-map relative h-[68vh] min-h-[380px] overflow-hidden rounded-2xl border border-lp-line bg-[#eef0ec] lg:h-[680px]">
          <ExploreMap
            states={statesGeo.data}
            riskRegions={riskCollection}
            districts={!stateHasData ? districtsGeo.data : undefined}
            statesWithData={statesWithData}
            selectedState={selectedState?.slug}
            selectedDistrict={selectedDistrict?.slug}
            focus={focus}
            refocus={refocus}
            onPick={onPick}
            onReady={() => setMapReady(true)}
            describe={describe}
          />
          <Legend />
          {geoLoading && <MapStatus>Loading map…</MapStatus>}
          {!geoLoading && !geoError && riskStatus === "loading" && <MapStatus>Loading risk data…</MapStatus>}
          {!geoLoading && riskStatus === "error" && <MapStatus tone="warning">Risk data unavailable · showing boundaries only</MapStatus>}
          {!geoLoading && riskStatus === "ready" && districtsGeo.isFetching && <MapStatus>Loading districts…</MapStatus>}
          {geoError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-lp-bg/90 p-6 text-center">
              <p className="text-[15px] font-medium text-lp-ink">Map data could not be loaded.</p>
              <button
                type="button"
                onClick={() => {
                  void statesGeo.refetch();
                  void index.refetch();
                }}
                className="rounded-full border border-lp-line-strong bg-lp-surface px-4 py-2 text-[14px] text-lp-ink hover:border-lp-ink-3"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-lp-line bg-lp-surface p-5 sm:p-6 lg:max-h-[680px] lg:overflow-y-auto" aria-live="polite">
          {invalidSelection && (
            <p className="mb-5 rounded-lg border border-lp-line bg-lp-bg px-4 py-3 text-[14px] text-lp-ink-2">
              That location wasn't found. Showing {selectedState && !selectedDistrict && sel.district ? selectedState.name : "India"} instead.
            </p>
          )}
          {selectedState && selectedDistrict ? (
            <DistrictPanel state={selectedState} district={selectedDistrict} region={selectedRegion} run={run} date={date} onSelectDate={(d) => setSel({ ...sel, run: run?.id, date: d })} />
          ) : selectedState ? (
            <StatePanel
              state={selectedState}
              hasData={stateHasData}
              regions={stateRegions}
              totalDistricts={stateDistricts.length}
              status={riskStatus}
              run={run}
              date={date}
              onSelectDistrict={(d) => goDistrict(selectedState.slug, d)}
            />
          ) : (
            <IndiaPanel coverage={coverage} status={riskStatus} date={date} onOpenState={goState} />
          )}
        </aside>
      </div>
    </div>
  );
}
