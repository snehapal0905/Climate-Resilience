import type { FeatureCollection } from "geojson";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LngLatBounds, Map as MapLibreMap, NavigationControl, Popup, type GeoJSONSource } from "maplibre-gl";
import { RISK_LEVEL_META, RISK_LEVELS, type RegionRiskCollection } from "@climate/shared";

const NO_DATA_COLOR = "#9a9a94";

const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const baseStyle = () => `https://tiles.openfreemap.org/styles/${darkQuery.matches ? "dark" : "positron"}`;

// ["match", ["get", "risk_level"], "low", "#…", "moderate", "#…", …, fallback]
const fillColor = [
  "match",
  ["coalesce", ["get", "risk_level"], "none"],
  ...RISK_LEVELS.flatMap((l) => [l, RISK_LEVEL_META[l].color]),
  NO_DATA_COLOR,
] as unknown as string;

interface Props {
  data: RegionRiskCollection | undefined;
  selected?: string;
  onSelect: (id: string) => void;
}

export function RiskMap({ data, selected, onSelect }: Props) {
  const { t } = useTranslation();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const loaded = useRef(false);
  const fitted = useRef(false);
  const prevSelected = useRef<string | undefined>(undefined);
  // Data that arrived before the map finished loading; applied in the "load" handler.
  const pendingApply = useRef<(() => void) | null>(null);
  // Keep the latest callback/translator without re-creating the map.
  const onSelectRef = useRef(onSelect);
  const tRef = useRef(t);
  onSelectRef.current = onSelect;
  tRef.current = t;

  useEffect(() => {
    const m = new MapLibreMap({
      container: container.current!,
      style: baseStyle(),
      center: [92.9, 26.2],
      zoom: 6,
      attributionControl: { compact: true },
    });
    map.current = m;
    m.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 12 });
    let hovered: string | number | undefined;

    m.on("load", () => {
      m.addSource("regions", { type: "geojson", data: { type: "FeatureCollection", features: [] }, promoteId: "id" });
      // Draw risk beneath the basemap's labels so town and river names stay readable.
      const firstLabelLayer = m.getStyle().layers.find((l) => l.type === "symbol")?.id;
      m.addLayer({
        id: "regions-fill",
        type: "fill",
        source: "regions",
        paint: {
          "fill-color": fillColor,
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.85, 0.65],
        },
      }, firstLabelLayer);
      m.addLayer({
        id: "regions-outline",
        type: "line",
        source: "regions",
        paint: {
          "line-color": darkQuery.matches ? "#1a1a19" : "#fcfcfb",
          "line-width": 1,
        },
      }, firstLabelLayer);
      m.addLayer({
        id: "regions-selected",
        type: "line",
        source: "regions",
        paint: {
          "line-color": darkQuery.matches ? "#f2f2ef" : "#1d1d1b",
          "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2.5, 0],
        },
      });
      loaded.current = true;
      pendingApply.current?.();
      pendingApply.current = null;
    });

    m.on("mousemove", "regions-fill", (e) => {
      const f = e.features?.[0];
      if (!f) return;
      if (hovered !== undefined) m.setFeatureState({ source: "regions", id: hovered }, { hover: false });
      hovered = f.id;
      m.setFeatureState({ source: "regions", id: hovered! }, { hover: true });
      m.getCanvas().style.cursor = "pointer";
      const level = f.properties.risk_level as string | undefined;
      const levelText = level ? tRef.current(`risk.${level}`) : tRef.current("risk.none");
      const el = document.createElement("div");
      el.innerHTML = `<div style="font-weight:600"></div><div style="color:var(--ink-2);font-size:12px"></div>`;
      el.children[0]!.textContent = String(f.properties.name);
      el.children[1]!.textContent = `${tRef.current("risk.legend")}: ${levelText}`;
      popup.setLngLat(e.lngLat).setDOMContent(el).addTo(m);
    });
    m.on("mouseleave", "regions-fill", () => {
      if (hovered !== undefined) m.setFeatureState({ source: "regions", id: hovered }, { hover: false });
      hovered = undefined;
      m.getCanvas().style.cursor = "";
      popup.remove();
    });
    m.on("click", "regions-fill", (e) => {
      const id = e.features?.[0]?.id;
      if (id !== undefined) onSelectRef.current(String(id));
    });

    return () => {
      m.remove();
      map.current = null;
      loaded.current = false;
    };
  }, []);

  // Push new risk data into the map source.
  useEffect(() => {
    const m = map.current;
    if (!m || !data) return;
    const apply = () => {
      (m.getSource("regions") as GeoJSONSource).setData(data as FeatureCollection);
      if (prevSelected.current) m.setFeatureState({ source: "regions", id: prevSelected.current }, { selected: true });
      if (!fitted.current && data.features.length) {
        const bounds = new LngLatBounds();
        for (const f of data.features) {
          const coords = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.flat(2) : f.geometry.type === "Polygon" ? f.geometry.coordinates.flat() : [];
          for (const c of coords) bounds.extend(c as [number, number]);
        }
        // Extra top padding keeps the northern districts clear of the day strip overlay.
        m.fitBounds(bounds, { padding: { top: 100, bottom: 24, left: 24, right: 56 }, duration: 0 });
        fitted.current = true;
      }
    };
    if (loaded.current) apply();
    else pendingApply.current = apply;
  }, [data]);

  // Outline the selected region.
  useEffect(() => {
    const m = map.current;
    if (!m || !loaded.current) {
      prevSelected.current = selected;
      return;
    }
    if (prevSelected.current) m.setFeatureState({ source: "regions", id: prevSelected.current }, { selected: false });
    if (selected) m.setFeatureState({ source: "regions", id: selected }, { selected: true });
    prevSelected.current = selected;
  }, [selected, data]);

  return (
    <div className="relative h-full w-full">
      <div ref={container} className="h-full w-full" role="region" aria-label={t("risk.legend")} />
      <Legend />
    </div>
  );
}

function Legend() {
  const { t } = useTranslation();
  return (
    <div className="absolute bottom-9 left-3 rounded-lg lg:bottom-3 border border-line bg-panel/95 px-3 py-2 text-xs shadow-sm">
      <div className="mb-1 font-semibold text-ink">{t("risk.legend")}</div>
      <ul className="space-y-1">
        {RISK_LEVELS.map((l) => (
          <li key={l} className="flex items-center gap-2 text-ink-2">
            <span className="h-3 w-3 rounded-sm" style={{ background: RISK_LEVEL_META[l].color }} />
            {t(`risk.${l}`)}
          </li>
        ))}
        <li className="flex items-center gap-2 text-ink-3">
          <span className="h-3 w-3 rounded-sm" style={{ background: NO_DATA_COLOR }} />
          {t("risk.none")}
        </li>
      </ul>
    </div>
  );
}
