/**
 * Interactive 3D Earth for the landing hero.
 *
 * This wrapper stays light: it owns interaction (pointer drag with inertia, keyboard, focus),
 * reduced-motion and visibility detection, and shows a static Earth until the Three.js scene
 * (earth-scene.tsx, loaded on demand) has rendered — or instead of it when WebGL is unavailable
 * or the scene fails.
 */
import { Component, lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { CLIMATE_RISK_MARKERS_SUMMARY } from "./climate-risk-data";
import { clampPitch, DEG, HOME_PITCH, HOME_YAW, type EarthRotation } from "./earth-rotation";

const EarthScene = lazy(() => import("./earth-scene"));

/** WebGL with a hardware GPU. Software renderers are too slow for the globe and can freeze the page. */
function canRun3D(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|basic render driver|software/i.test(renderer);
  } catch {
    return false;
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

class SceneErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Static Earth shown while loading and whenever the 3D scene can't run. */
export function StaticEarth() {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="se-ocean" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#7ea39e" />
          <stop offset="60%" stopColor="#5f8784" />
          <stop offset="100%" stopColor="#3f625f" />
        </radialGradient>
        <radialGradient id="se-india" cx="58%" cy="44%" r="22%">
          <stop offset="0%" stopColor="#d6e8c4" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#d6e8c4" stopOpacity="0" />
        </radialGradient>
        <clipPath id="se-clip">
          <circle cx="200" cy="200" r="172" />
        </clipPath>
      </defs>
      <circle cx="200" cy="200" r="179" fill="none" stroke="#7fae9c" strokeOpacity="0.28" strokeWidth="6" />
      <circle cx="200" cy="200" r="172" fill="url(#se-ocean)" />
      <g clipPath="url(#se-clip)" fill="#2c5240">
        {/* Loose suggestion of Asia, Africa and Australia — not a map */}
        <path d="M120 70c40-22 120-30 190-8 30 10 52 32 60 58-18 6-40 4-58 16-10 7-8 22-22 30-12 7-28-4-40 6-8 7-4 22-14 34-8 10-22 14-28 28l-14 32-16-26c-6-12-20-18-26-30-8-14 0-32-12-42-14-12-36-6-50-18-14-12-10-36 2-50 6-8 16-14 28-20z" />
        <path d="M60 170c18-8 40-4 52 10 10 12 8 30 18 42 10 14 6 34-4 48-12 18-16 40-34 52-10-18-8-40-20-56-10-14-28-22-30-40-2-22 4-46 18-56z" />
        <path d="M300 280c20-6 46 0 56 16 6 12-2 28-16 32-18 6-40 2-52-10-8-10-2-32 12-38z" />
      </g>
      <circle cx="200" cy="200" r="172" fill="url(#se-india)" />
      {[
        [238, 150, "#e07a52"],
        [214, 160, "#e07a52"],
        [232, 182, "#e9b44c"],
        [216, 186, "#e9b44c"],
        [222, 138, "#8fc79b"],
      ].map(([cx, cy, c]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="5.5" fill="#f4f6f0" opacity="0.85" />
          <circle cx={cx} cy={cy} r="3.6" fill={c as string} />
        </g>
      ))}
    </svg>
  );
}

const KEY_STEP = 12 * DEG;

export function InteractiveEarth({ className = "" }: { className?: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const [webgl] = useState(canRun3D);
  const [tooSlow, setTooSlow] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  // Start the 3D scene once the browser is idle, so the rest of the hero is interactive first.
  const [mountScene, setMountScene] = useState(false);
  useEffect(() => {
    if (!webgl) return;
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setMountScene(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setMountScene(true), 300);
    return () => clearTimeout(id);
  }, [webgl]);
  const container = useRef<HTMLDivElement>(null);
  const rotation = useRef<EarthRotation>({ yaw: HOME_YAW, pitch: HOME_PITCH, velYaw: 0, velPitch: 0, dragging: false, lastInteraction: 0 });
  const pointer = useRef<{ id: number; x: number; y: number; t: number } | null>(null);

  // Stop rendering while the hero is scrolled out of view.
  useEffect(() => {
    const el = container.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
    Object.assign(rotation.current, { dragging: true, velYaw: 0, velPitch: 0, lastInteraction: performance.now() });
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointer.current;
    if (!p || p.id !== e.pointerId) return;
    const width = e.currentTarget.clientWidth || 400;
    const now = performance.now();
    const dt = Math.max(1, now - p.t) / 1000;
    // Dragging across the full width turns the globe by ~180°.
    const dYaw = ((e.clientX - p.x) / width) * Math.PI;
    const dPitch = ((e.clientY - p.y) / width) * Math.PI * 0.5;
    const r = rotation.current;
    r.yaw += dYaw;
    r.pitch = clampPitch(r.pitch + dPitch);
    // Smoothed velocity for a natural release.
    r.velYaw = r.velYaw * 0.6 + (dYaw / dt) * 0.4;
    r.velPitch = r.velPitch * 0.6 + (dPitch / dt) * 0.4;
    r.lastInteraction = now;
    pointer.current = { id: p.id, x: e.clientX, y: e.clientY, t: now };
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== e.pointerId) return;
    const r = rotation.current;
    // A pause before releasing means no fling.
    if (performance.now() - pointer.current.t > 80) Object.assign(r, { velYaw: 0, velPitch: 0 });
    pointer.current = null;
    Object.assign(r, { dragging: false, lastInteraction: performance.now() });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const r = rotation.current;
    const step = { ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP / 2], ArrowDown: [0, KEY_STEP / 2] }[e.key];
    if (step) {
      r.yaw += step[0]!;
      r.pitch = clampPitch(r.pitch + step[1]!);
    } else if (e.key === "Home") {
      Object.assign(r, { yaw: HOME_YAW, pitch: HOME_PITCH });
    } else return;
    e.preventDefault();
    Object.assign(r, { velYaw: 0, velPitch: 0, lastInteraction: performance.now() });
  };

  return (
    <div
      ref={container}
      tabIndex={0}
      role="group"
      aria-roledescription="interactive globe"
      aria-label="Interactive Earth climate risk visualization"
      aria-describedby="earth-help earth-markers"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      // Horizontal drags rotate the globe; vertical swipes on touch screens still scroll the page.
      style={{ touchAction: "pan-y" }}
      className={`group relative cursor-grab select-none rounded-full outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-lp-green focus-visible:ring-offset-4 focus-visible:ring-offset-lp-bg ${className}`}
    >
      {/* Soft ground shadow */}
      <div className="pointer-events-none absolute inset-x-[18%] bottom-[2%] h-[7%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(22_32_27/0.16),transparent)]" aria-hidden="true" />

      <div className={`absolute inset-[7%] transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}>
        <StaticEarth />
      </div>

      {mountScene && !tooSlow && (
        <SceneErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
              <EarthScene rotation={rotation} reducedMotion={reducedMotion} active={visible} onReady={() => setReady(true)} onTooSlow={() => {
                setReady(false);
                setTooSlow(true);
              }} />
            </div>
          </Suspense>
        </SceneErrorBoundary>
      )}

      <p id="earth-help" className="sr-only">
        Drag to rotate the Earth, or use the arrow keys. Press Home to return to India.
      </p>
      <p id="earth-markers" className="sr-only">
        {CLIMATE_RISK_MARKERS_SUMMARY}
      </p>
    </div>
  );
}
