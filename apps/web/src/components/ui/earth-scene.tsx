/**
 * The Three.js part of the hero globe, loaded on demand by interactive-earth.tsx.
 * Rotation is driven by the shared EarthRotation ref, so pointer and keyboard handling stay in
 * the (light) wrapper and React never re-renders per frame.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { ClimateRiskMarkers } from "./climate-risk-markers";
import { paintEarthTexture } from "./earth-texture";
import { clampPitch, HOME_PITCH, type EarthRotation } from "./earth-rotation";

const RADIUS = 1;
const FOV = 32;
/** Share of the canvas the globe (with its atmosphere) spans. */
const FILL = 0.86;
/** Auto-rotation speed (rad/s): one turn every ~4 minutes. */
const AUTO_SPEED = 0.026;
/** Seconds of inactivity before auto-rotation resumes. */
const IDLE_SECONDS = 3.5;
const INERTIA_DECAY = 2.8;
const MAX_DPR = 2;

/** Keeps the whole globe in frame whatever the canvas aspect ratio. */
function CameraFit() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { width, height } = useThree((s) => s.size);
  useLayoutEffect(() => {
    const aspect = width / Math.max(1, height);
    const visible = (2 * RADIUS * 1.06) / FILL;
    camera.position.set(0, 0, visible / (2 * Math.tan((FOV * Math.PI) / 360) * Math.min(1, aspect)));
    camera.updateProjectionMatrix();
  }, [camera, width, height]);
  return null;
}

/** Lowers the pixel ratio when frames drop and restores it when there is headroom. */
function AdaptiveDpr() {
  const setDpr = useThree((s) => s.setDpr);
  const max = Math.min(MAX_DPR, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
  const stats = useRef({ frames: 0, time: 0, dpr: max });
  useFrame((_, delta) => {
    const s = stats.current;
    s.frames += 1;
    s.time += delta;
    if (s.time < 1.5) return;
    const fps = s.frames / s.time;
    const next = fps < 45 ? Math.max(1, s.dpr - 0.25) : fps > 57 ? Math.min(max, s.dpr + 0.25) : s.dpr;
    if (next !== s.dpr) {
      s.dpr = next;
      setDpr(next);
    }
    s.frames = 0;
    s.time = 0;
  });
  return null;
}

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vNormal;
  void main() {
    // Back faces of a slightly larger shell: view-space normal.z runs from 0 at the shell's outer
    // silhouette to about -0.26 where it meets the planet's limb, so fade in over that band.
    float rim = pow(smoothstep(0.0, 0.26, -vNormal.z), 2.0);
    gl_FragColor = vec4(uColor, rim * uOpacity);
  }
`;

/** A thin translucent shell around the planet, not a halo. */
function Atmosphere() {
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color("#8fbcaa") }, uOpacity: { value: 0.38 } }), []);
  return (
    <mesh scale={1.035}>
      <sphereGeometry args={[RADIUS, 64, 48]} />
      <shaderMaterial
        vertexShader={atmosphereVertex}
        fragmentShader={atmosphereFragment}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/** Below this average frame rate (over the first seconds) the static Earth is shown instead. */
const MIN_FPS = 24;
const FPS_SAMPLE_SECONDS = 3;

function Globe({
  rotation,
  reducedMotion,
  onReady,
  onTooSlow,
}: {
  rotation: RefObject<EarthRotation>;
  reducedMotion: boolean;
  onReady: () => void;
  onTooSlow: () => void;
}) {
  const fps = useRef({ frames: 0, time: 0, done: false });
  const gl = useThree((s) => s.gl);
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const readyFired = useRef(false);

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(paintEarthTexture());
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return t;
  }, [gl]);
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((_, rawDelta) => {
    const f = fps.current;
    if (!f.done) {
      f.frames += 1;
      f.time += rawDelta;
      if (f.time >= FPS_SAMPLE_SECONDS) {
        f.done = true;
        if (f.frames / f.time < MIN_FPS) onTooSlow();
      }
    }
    const delta = Math.min(rawDelta, 0.1);
    const r = rotation.current;
    if (!r.dragging) {
      if (reducedMotion) {
        r.velYaw = 0;
        r.velPitch = 0;
      } else {
        // Inertia after release
        r.yaw += r.velYaw * delta;
        r.pitch = clampPitch(r.pitch + r.velPitch * delta);
        const decay = Math.exp(-INERTIA_DECAY * delta);
        r.velYaw *= decay;
        r.velPitch *= decay;

        // Very slow auto-rotation once idle, easing in, with the tilt drifting back to India.
        const idle = (performance.now() - r.lastInteraction) / 1000 - IDLE_SECONDS;
        if (idle > 0) {
          const ease = Math.min(1, idle / 2);
          r.yaw += AUTO_SPEED * ease * delta;
          r.pitch += (HOME_PITCH - r.pitch) * Math.min(1, delta * 0.4 * ease);
        }
      }
    }
    if (spin.current) spin.current.rotation.y = r.yaw;
    if (tilt.current) tilt.current.rotation.x = r.pitch;
    if (!readyFired.current) {
      readyFired.current = true;
      onReady();
    }
  });

  return (
    <group ref={tilt}>
      <group ref={spin}>
        <mesh>
          <sphereGeometry args={[RADIUS, 96, 64]} />
          <meshLambertMaterial map={texture} />
        </mesh>
        <ClimateRiskMarkers radius={RADIUS} animate={!reducedMotion} />
      </group>
    </group>
  );
}

export default function EarthScene({
  rotation,
  reducedMotion,
  active,
  onReady,
  onTooSlow,
}: {
  rotation: RefObject<EarthRotation>;
  reducedMotion: boolean;
  /** false while scrolled out of view: stops the render loop */
  active: boolean;
  onReady: () => void;
  onTooSlow: () => void;
}) {
  return (
    <Canvas
      dpr={[1, MAX_DPR]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: FOV, near: 0.1, far: 50, position: [0, 0, 5] }}
      gl={{ antialias: true, alpha: true, powerPreference: "default" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        // Reading shader logs forces the page to wait for compilation, which can freeze it for
        // seconds on slow GPUs, so never do it.
        gl.debug.checkShaderErrors = false;
      }}
      aria-hidden="true"
    >
      <CameraFit />
      <AdaptiveDpr />
      <ambientLight intensity={1.15} />
      {/* Soft key light from the upper left, a faint cool fill from behind-right */}
      <directionalLight position={[-3, 2.2, 4]} intensity={1.7} />
      <directionalLight position={[4, -1, -2]} intensity={0.25} color="#cfe3dc" />
      <Globe rotation={rotation} reducedMotion={reducedMotion} onReady={onReady} onTooSlow={onTooSlow} />
      <Atmosphere />
    </Canvas>
  );
}
