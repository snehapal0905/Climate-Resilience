/** Pulsing climate-risk markers pinned to the globe (data in climate-risk-data.ts). */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CLIMATE_RISK_MARKERS, MARKER_COLORS, type ClimateRiskMarker } from "./climate-risk-data";

/** Same mapping as the globe texture: lon 0 at +X, lon 90°E at -Z, north at +Y. */
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  return new THREE.Vector3(radius * Math.cos(phi) * Math.cos(lambda), radius * Math.sin(phi), -radius * Math.cos(phi) * Math.sin(lambda));
}

const PULSE_SECONDS = 2.8;

function Marker({ marker, radius, index, animate }: { marker: ClimateRiskMarker; radius: number; index: number; animate: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const color = MARKER_COLORS[marker.level];

  // Orient each marker so its flat ring lies on the globe's surface.
  const { position, quaternion } = useMemo(() => {
    const position = latLonToVector3(marker.lat, marker.lon, radius * 1.004);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize());
    return { position, quaternion };
  }, [marker.lat, marker.lon, radius]);

  useFrame(({ clock }) => {
    if (!ring.current || !ringMaterial.current) return;
    if (!animate) {
      ring.current.scale.setScalar(1.6);
      ringMaterial.current.opacity = 0.35;
      return;
    }
    const t = ((clock.elapsedTime + index * 0.55) % PULSE_SECONDS) / PULSE_SECONDS;
    ring.current.scale.setScalar(1 + t * 2.4);
    ringMaterial.current.opacity = 0.55 * (1 - t);
  });

  return (
    <group position={position} quaternion={quaternion}>
      <mesh ref={ring}>
        <ringGeometry args={[0.016, 0.022, 40]} />
        <meshBasicMaterial ref={ringMaterial} color={color} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.014, 24]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.0005]}>
        <circleGeometry args={[0.02, 24]} />
        <meshBasicMaterial color="#f4f6f0" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function ClimateRiskMarkers({ radius, animate }: { radius: number; animate: boolean }) {
  return (
    <group>
      {CLIMATE_RISK_MARKERS.map((m, i) => (
        <Marker key={m.id} marker={m} radius={radius} index={i} animate={animate} />
      ))}
    </group>
  );
}
