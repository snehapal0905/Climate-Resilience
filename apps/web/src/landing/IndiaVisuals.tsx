/**
 * Decorative India illustrations for the landing page. Everything here is static SVG:
 * hotspots and contours are illustrative, not live risk data.
 */
import { RISK_LEVEL_META } from "@climate/shared";
import { ILLUSTRATIVE_CONTOURS, ILLUSTRATIVE_HOTSPOTS, INDIA_OUTLINE, INDIA_STATES, INDIA_VIEWBOX } from "./indiaGeometry";

const { width: W, height: H } = INDIA_VIEWBOX;

/** Hero: dotted India silhouette, faint graticule, contour bands and pulsing hotspots. */
export function HeroIndiaVisual() {
  return (
    <svg viewBox={`-40 -20 ${W + 80} ${H + 40}`} className="h-full w-full" role="img" aria-label="Illustrative map of India showing climate risk contours">
      <defs>
        <radialGradient id="lp-glow" cx="55%" cy="42%" r="60%">
          <stop offset="0%" stopColor="var(--lp-green-soft)" stopOpacity="0.95" />
          <stop offset="70%" stopColor="var(--lp-bg)" stopOpacity="0" />
        </radialGradient>
        <pattern id="lp-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="2.1" fill="var(--lp-green)" opacity="0.28" />
        </pattern>
        <clipPath id="lp-india-clip">
          <path d={INDIA_OUTLINE} />
        </clipPath>
      </defs>

      <rect x={-40} y={-20} width={W + 80} height={H + 40} fill="url(#lp-glow)" />

      {/* Graticule */}
      <g stroke="var(--lp-ink)" strokeOpacity="0.06" strokeWidth="1">
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`v${i}`} x1={i * 100 - 50} y1={-20} x2={i * 100 - 50} y2={H + 20} />
        ))}
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`h${i}`} x1={-40} y1={i * 100 - 50} x2={W + 40} y2={i * 100 - 50} />
        ))}
      </g>

      <path d={INDIA_OUTLINE} fill="var(--lp-surface)" fillOpacity="0.55" />
      <path d={INDIA_OUTLINE} fill="url(#lp-dots)" />

      {/* Contour bands, clipped to the country */}
      <g clipPath="url(#lp-india-clip)" fill="none" stroke="var(--lp-green)" strokeLinejoin="round">
        {ILLUSTRATIVE_CONTOURS.map((c, i) => (
          <path key={c.level} d={c.d} strokeWidth={1.2 + i * 0.25} strokeOpacity={0.18 + i * 0.11} fill="var(--lp-green)" fillOpacity={0.025} />
        ))}
      </g>

      <path d={INDIA_OUTLINE} fill="none" stroke="var(--lp-green)" strokeOpacity="0.55" strokeWidth="1.6" strokeLinejoin="round" />

      {ILLUSTRATIVE_HOTSPOTS.map((h, i) => {
        const color = RISK_LEVEL_META[h.level].color;
        return (
          <g key={h.id} transform={`translate(${h.x} ${h.y})`}>
            <circle r="11" fill={color} className="lp-pulse" style={{ animationDelay: `${(i % 5) * 0.7}s` }} />
            <circle r="10" fill={color} stroke="var(--lp-surface)" strokeWidth="3.5" />
          </g>
        );
      })}
    </svg>
  );
}

/** Preview of the future India risk map: all states outlined, Assam highlighted as the live region. */
export function IndiaPreviewMap() {
  return (
    <svg viewBox={`-10 -10 ${W + 20} ${H + 20}`} className="h-full w-full" role="img" aria-label="Map of India with Assam highlighted as the currently live region">
      <defs>
        <pattern id="lp-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="var(--lp-ink)" strokeOpacity="0.1" strokeWidth="3" />
        </pattern>
      </defs>
      {INDIA_STATES.map((s) =>
        s.name === "Assam" ? null : (
          <path key={s.name} d={s.d} fill="url(#lp-hatch)" stroke="var(--lp-line-strong)" strokeWidth="1.8" strokeLinejoin="round">
            <title>{`${s.name}: coming soon`}</title>
          </path>
        ),
      )}
      {INDIA_STATES.filter((s) => s.name === "Assam").map((s) => (
        <path key={s.name} d={s.d} fill="var(--lp-green)" stroke="var(--lp-green)" strokeWidth="2" strokeLinejoin="round">
          <title>Assam: flood forecasts live</title>
        </path>
      ))}
    </svg>
  );
}
