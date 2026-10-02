/**
 * Paints the globe's surface into an equirectangular canvas: muted blue-green ocean, deep green
 * land with a fine dot grain (the same dotted language as the rest of the landing page), a faint
 * graticule and a soft glow over India. Land comes from Natural Earth 1:110m (world-atlas) as a
 * single merged landmass, so no political borders are drawn.
 */
import type { MultiPolygon, Polygon, Position } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import landTopology from "world-atlas/land-110m.json";

const W = 2048;
const H = 1024;

export const EARTH_COLORS = {
  oceanDeep: "#58817f",
  oceanShallow: "#6f9893",
  land: "#2c5240",
  landGrain: "#4d7a62",
  coast: "#1f3f31",
  graticule: "rgba(240, 245, 238, 0.08)",
  indiaGlow: "rgba(214, 232, 196, 0.42)",
} as const;

const x = (lon: number) => ((lon + 180) / 360) * W;
const y = (lat: number) => ((90 - lat) / 180) * H;

function tracePolygon(ctx: CanvasRenderingContext2D, rings: Position[][]) {
  for (const ring of rings) {
    ring.forEach(([lon, lat], i) => (i === 0 ? ctx.moveTo(x(lon!), y(lat!)) : ctx.lineTo(x(lon!), y(lat!))));
    ctx.closePath();
  }
}

function landPath(ctx: CanvasRenderingContext2D) {
  const topo = landTopology as unknown as Topology<{ land: GeometryCollection }>;
  const land = feature(topo, topo.objects.land);
  ctx.beginPath();
  for (const f of land.features) {
    const g = f.geometry as Polygon | MultiPolygon;
    if (g.type === "Polygon") tracePolygon(ctx, g.coordinates);
    else for (const poly of g.coordinates) tracePolygon(ctx, poly);
  }
}

export function paintEarthTexture(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Ocean: slightly lighter towards the equator for a sense of depth.
  const ocean = ctx.createLinearGradient(0, 0, 0, H);
  ocean.addColorStop(0, EARTH_COLORS.oceanDeep);
  ocean.addColorStop(0.5, EARTH_COLORS.oceanShallow);
  ocean.addColorStop(1, EARTH_COLORS.oceanDeep);
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, W, H);

  // Graticule every 15°.
  ctx.strokeStyle = EARTH_COLORS.graticule;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let lon = -180; lon <= 180; lon += 15) {
    ctx.moveTo(x(lon), 0);
    ctx.lineTo(x(lon), H);
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    ctx.moveTo(0, y(lat));
    ctx.lineTo(W, y(lat));
  }
  ctx.stroke();

  // Land fill, then a dot grain clipped to it, then a fine coastline.
  landPath(ctx);
  ctx.fillStyle = EARTH_COLORS.land;
  ctx.fill("evenodd");

  ctx.save();
  ctx.clip("evenodd");
  // Soft glow centred on India (no outline: borders are deliberately not drawn).
  const glow = ctx.createRadialGradient(x(79), y(22), 0, x(79), y(22), 150);
  glow.addColorStop(0, EARTH_COLORS.indiaGlow);
  glow.addColorStop(1, "rgba(214, 232, 196, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x(79) - 160, y(22) - 160, 320, 320);

  ctx.fillStyle = EARTH_COLORS.landGrain;
  const step = 7;
  for (let py = step / 2; py < H; py += step) {
    // Widen dot spacing towards the poles so the grain looks even on the sphere.
    const stretch = 1 / Math.max(0.25, Math.cos(((90 - (py / H) * 180) * Math.PI) / 180));
    const sx = step * stretch;
    for (let px = (py / step) % 2 ? sx / 2 : 0; px < W; px += sx) {
      ctx.fillRect(px, py, 2.2, 2.2);
    }
  }
  ctx.restore();

  landPath(ctx);
  ctx.strokeStyle = EARTH_COLORS.coast;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  return canvas;
}
