/** Rotation state and limits shared by the hero globe wrapper and its Three.js scene. */

export const DEG = Math.PI / 180;
/** Initial view: India (≈79°E, 22°N) facing the viewer. */
export const HOME_YAW = -Math.PI / 2 - 79 * DEG;
export const HOME_PITCH = 20 * DEG;
export const PITCH_LIMITS = [-25 * DEG, 50 * DEG] as const;

/** Mutable rotation state shared with the scene's render loop (kept out of React state on purpose). */
export interface EarthRotation {
  yaw: number;
  pitch: number;
  /** Angular velocity (rad/s) used for inertia after a drag or key press */
  velYaw: number;
  velPitch: number;
  dragging: boolean;
  /** performance.now() of the last user interaction; auto-rotation resumes a few seconds after */
  lastInteraction: number;
}

export const clampPitch = (p: number) => Math.min(PITCH_LIMITS[1], Math.max(PITCH_LIMITS[0], p));
