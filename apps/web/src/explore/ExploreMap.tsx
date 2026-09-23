/**
 * India map for Explore: states → districts, with flood risk from the risk API where a model
 * exists and a hatched neutral grey "no data" fill everywhere else.
 */
import type { FeatureCollection, Geometry } from "geojson";
import { useEffect, useRef } from "react";
import { Map as MapLibreMap, NavigationControl, Popup, type ExpressionSpecification, type GeoJSONSource, type MapGeoJSONFeature } from "maplibre-gl";
import { NO_DATA_COLOR, RISK_LEVEL_META, RISK_LEVELS } from "@climate/shared";
import { INDIA_BBOX, type BBox, type DistrictsCollection, type StatesCollection } from "./geo";

/** Model regions (districts with predictions) with the slugs used by the Explore URL. */
export type RiskRegionsCollection = FeatureCollection<
  Geometry,
  { id: string; name: string; risk_level: string | null; risk_score: number | null; state_slug: string; district_slug: string }
>;

export interface HoverInfo {
  title: string;
  detail: string;
}

interface Props {
  states: StatesCollection | undefined;
  riskRegions: RiskRegionsCollection | undefined;
  /** Static district boundaries for the selected state, when it has no model regions */
  districts: DistrictsCollection | undefined;
  statesWithData: readonly string[];
  selectedState?: string;
  selectedDistrict?: string;
  focus: BBox | undefined;
  /** Bumped to re-fit the map to `focus` even when it hasn't changed (e.g. clicking the current breadcrumb). */
  refocus: number;
  onPick: (stateSlug: string, districtSlug: string | undefined) => void;
  /** Called once the basemap and all layers are ready for interaction. */
  onReady: () => void;
  describe: (stateSlug: string, districtSlug: string | undefined) => HoverInfo;
}

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };
const BASE_STYLE = "https://tiles.openfreemap.org/styles/positron";

const riskFill = [
  "match",
  ["coalesce", ["get", "risk_level"], "none"],
  ...RISK_LEVELS.flatMap((l) => [l, RISK_LEVEL_META[l].color]),
  NO_DATA_COLOR,
] as unknown as string;

/** Diagonal hatch used on top of the grey "no data" fill so it can't be read as a risk colour. */
function hatchImage(size = 12) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const on = (x + y) % size < 2;
      const i = (y * size + x) * 4;
      data.set(on ? [120, 122, 116, 55] : [0, 0, 0, 0], i);
    }
  return { width: size, height: size, data };
}

export function ExploreMap(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const queue = useRef<Array<() => void>>([]);
  const loaded = useRef(false);
  const latest = useRef(props);
  latest.current = props;

  const whenLoaded = (fn: () => void) => {
    if (loaded.current) fn();
    else queue.current.push(fn);
  };

  useEffect(() => {
    const small = window.matchMedia("(max-width: 640px)").matches;
    const m = new MapLibreMap({
      container: container.current!,
      style: BASE_STYLE,
      bounds: INDIA_BBOX,
      fitBoundsOptions: { padding: small ? 12 : 32 },
      minZoom: 3,
      maxZoom: 11,
      maxBounds: [
        [55, -2],
        [110, 45],
      ],
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapRef.current = m;
    m.touchZoomRotate.disableRotation();
    m.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 14, maxWidth: "260px" });

    m.on("load", () => {
      m.addImage("no-data-hatch", hatchImage());
      const symbolLayers = m.getStyle().layers.filter((l) => l.type === "symbol");
      // Calmer basemap: one script (English/Latin) for place names instead of stacked multi-script labels.
      for (const l of symbolLayers) {
        if (m.getLayoutProperty(l.id, "text-field") != null) {
          m.setLayoutProperty(l.id, "text-field", ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"]]);
        }
      }
      const beforeLabels = symbolLayers[0]?.id;
      m.addSource("states", { type: "geojson", data: EMPTY, promoteId: "slug" });
      m.addSource("risk", { type: "geojson", data: EMPTY, promoteId: "id" });
      m.addSource("districts", { type: "geojson", data: EMPTY, promoteId: "slug" });

      // No-data states: neutral grey + hatch (never a risk colour).
      m.addLayer({ id: "states-nodata", type: "fill", source: "states", paint: { "fill-color": NO_DATA_COLOR, "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.32, 0.2] } }, beforeLabels);
      m.addLayer({ id: "states-nodata-hatch", type: "fill", source: "states", paint: { "fill-pattern": "no-data-hatch" } }, beforeLabels);
      // Model regions coloured by risk level.
      m.addLayer({ id: "risk-fill", type: "fill", source: "risk", paint: { "fill-color": riskFill, "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.92, 0.78] } }, beforeLabels);
      m.addLayer({ id: "risk-outline", type: "line", source: "risk", paint: { "line-color": "#fdfdfb", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.3, 7, 1] } }, beforeLabels);
      // Static district boundaries for an opened no-data state.
      m.addLayer({ id: "districts-fill", type: "fill", source: "districts", paint: { "fill-color": "#1f5a41", "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.1, 0] } }, beforeLabels);
      m.addLayer({ id: "districts-outline", type: "line", source: "districts", paint: { "line-color": "#6b7570", "line-opacity": 0.55, "line-width": 0.8 } }, beforeLabels);
      // Fade neighbouring districts while a district is selected.
      m.addLayer({ id: "risk-dim", type: "fill", source: "risk", filter: ["==", ["get", "id"], ""], paint: { "fill-color": "#f6f5f0", "fill-opacity": 0.45 } }, beforeLabels);
      m.addLayer({ id: "districts-dim", type: "fill", source: "districts", filter: ["==", ["get", "slug"], ""], paint: { "fill-color": "#f6f5f0", "fill-opacity": 0.45 } }, beforeLabels);
      // Dim everything outside the selected state.
      m.addLayer({ id: "states-dim", type: "fill", source: "states", filter: ["==", ["get", "slug"], ""], paint: { "fill-color": "#f6f5f0", "fill-opacity": 0.55 } }, beforeLabels);
      m.addLayer({ id: "states-outline", type: "line", source: "states", paint: { "line-color": "#8f978f", "line-opacity": 0.7, "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.4, 7, 1.1] } }, beforeLabels);
      m.addLayer({ id: "state-selected", type: "line", source: "states", filter: ["==", ["get", "slug"], ""], paint: { "line-color": "#1f5a41", "line-width": 2.2 } }, beforeLabels);
      m.addLayer({ id: "district-selected-risk", type: "line", source: "risk", filter: ["==", ["get", "district_slug"], ""], paint: { "line-color": "#17201b", "line-width": 2.6 } });
      m.addLayer({ id: "district-selected", type: "line", source: "districts", filter: ["==", ["get", "slug"], ""], paint: { "line-color": "#17201b", "line-width": 2.6 } });
      // Invisible layer covering every state, used to work out which state was clicked.
      m.addLayer({ id: "states-hit", type: "fill", source: "states", paint: { "fill-opacity": 0 } });

      loaded.current = true;
      queue.current.splice(0).forEach((fn) => fn());
      latest.current.onReady();
    });

    let hovered: { source: string; id: string | number }[] = [];
    const clearHover = () => {
      hovered.forEach((h) => m.setFeatureState(h, { hover: false }));
      hovered = [];
    };
    const pick = (features: MapGeoJSONFeature[]) => {
      const state = features.find((f) => f.layer.id === "states-hit")?.properties.slug as string | undefined;
      const region = features.find((f) => f.layer.id === "risk-fill");
      const district = features.find((f) => f.layer.id === "districts-fill");
      const districtSlug = (region?.properties.district_slug ?? district?.properties.slug) as string | undefined;
      const hoverTargets = [
        region && { source: "risk", id: region.id! },
        district && { source: "districts", id: district.id! },
        !region && state && { source: "states", id: state },
      ].filter(Boolean) as { source: string; id: string | number }[];
      return { state, districtSlug, hoverTargets };
    };
    const layers = ["states-hit", "risk-fill", "districts-fill"];

    m.on("mousemove", (e) => {
      if (!loaded.current) return;
      const { state, districtSlug, hoverTargets } = pick(m.queryRenderedFeatures(e.point, { layers }));
      clearHover();
      if (!state) {
        popup.remove();
        m.getCanvas().style.cursor = "";
        return;
      }
      hovered = hoverTargets;
      hovered.forEach((h) => m.setFeatureState(h, { hover: true }));
      m.getCanvas().style.cursor = "pointer";
      const info = latest.current.describe(state, districtSlug);
      const el = document.createElement("div");
      el.className = "lp-map-tip";
      el.append(Object.assign(document.createElement("strong"), { textContent: info.title }), Object.assign(document.createElement("span"), { textContent: info.detail }));
      popup.setLngLat(e.lngLat).setDOMContent(el).addTo(m);
    });
    m.getCanvas().addEventListener("mouseleave", () => {
      clearHover();
      popup.remove();
    });
    m.on("click", (e) => {
      if (!loaded.current) return;
      const { state, districtSlug } = pick(m.queryRenderedFeatures(e.point, { layers }));
      if (state) latest.current.onPick(state, districtSlug);
    });

    return () => {
      m.remove();
      mapRef.current = null;
      loaded.current = false;
    };
  }, []);

  const { states, riskRegions, districts, statesWithData, selectedState, selectedDistrict, focus, refocus } = props;

  useEffect(() => {
    if (states) whenLoaded(() => (mapRef.current!.getSource("states") as GeoJSONSource).setData(states));
  }, [states]);

  useEffect(() => {
    whenLoaded(() => (mapRef.current!.getSource("risk") as GeoJSONSource).setData(riskRegions ?? EMPTY));
  }, [riskRegions]);

  useEffect(() => {
    whenLoaded(() => (mapRef.current!.getSource("districts") as GeoJSONSource).setData(districts ?? EMPTY));
  }, [districts]);

  // States with model data are drawn by the risk layer, so they get no grey/hatch fill.
  const dataKey = statesWithData.join("|");
  useEffect(() => {
    whenLoaded(() => {
      const m = mapRef.current!;
      const noData = ["!", ["in", ["get", "slug"], ["literal", statesWithData]]] as unknown as boolean;
      m.setFilter("states-nodata", noData);
      m.setFilter("states-nodata-hatch", noData);
    });
  }, [dataKey]);

  useEffect(() => {
    whenLoaded(() => {
      const m = mapRef.current!;
      m.setFilter("states-dim", selectedState ? ["!=", ["get", "slug"], selectedState] : ["==", ["get", "slug"], ""]);
      m.setFilter("state-selected", ["==", ["get", "slug"], selectedState ?? ""]);
      m.setFilter("district-selected-risk", ["all", ["==", ["get", "state_slug"], selectedState ?? ""], ["==", ["get", "district_slug"], selectedDistrict ?? ""]]);
      m.setFilter("district-selected", ["==", ["get", "slug"], selectedDistrict ?? ""]);
      const inState: ExpressionSpecification = ["==", ["get", "state_slug"], selectedState ?? ""];
      m.setFilter("risk-dim", selectedDistrict ? ["all", inState, ["!=", ["get", "district_slug"], selectedDistrict]] : ["==", ["get", "id"], ""]);
      m.setFilter("districts-dim", selectedDistrict ? ["!=", ["get", "slug"], selectedDistrict] : ["==", ["get", "slug"], ""]);
    });
  }, [selectedState, selectedDistrict]);

  const focusKey = `${focus?.join(",")}|${refocus}`;
  useEffect(() => {
    if (!focus) return;
    whenLoaded(() => {
      const small = window.matchMedia("(max-width: 640px)").matches;
      mapRef.current!.fitBounds(focus, { padding: small ? 24 : 72, maxZoom: 8, duration: 700 });
    });
  }, [focusKey]);

  return <div ref={container} className="h-full w-full" aria-label="Map of India showing flood risk by state and district" role="region" />;
}
