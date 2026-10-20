export type Point3 = [number, number, number]

export const SCENE_Y = 0.24
export const DEE_THICKNESS = 0.14
export const DEE_RADIUS = 2.16
/** Textbook-scale machine: D-box radius 0.5 m (drawn as DEE_RADIUS scene units). */
export const DEE_RADIUS_M = 0.5
const SCENE_SCALE = DEE_RADIUS / DEE_RADIUS_M
export const MAX_ORBIT_RADIUS_M = DEE_RADIUS_M
export const DEE_TOP_Y = SCENE_Y + DEE_THICKNESS / 2
export const TRAJECTORY_Y = DEE_TOP_Y + 0.004
export const MIN_GAP_HALF_WIDTH_M = 0.005
export const MAX_GAP_HALF_WIDTH_M = 0.02

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(maxValue, Math.max(minValue, value))
}

/** The gap is drawn at its physical width (1–4 cm → 0.04–0.17 scene units). */
export function deriveGapWidthScene(gapHalfWidthM: number): number {
  return 2 * clamp(Math.abs(gapHalfWidthM), MIN_GAP_HALF_WIDTH_M, MAX_GAP_HALF_WIDTH_M) * SCENE_SCALE
}

function clampPointToChamber(x: number, z: number, maxRadius = DEE_RADIUS): Point3 {
  const radius = Math.hypot(x, z)
  if (radius <= maxRadius) {
    return [x, TRAJECTORY_Y, z]
  }
  const scale = maxRadius / radius
  return [x * scale, TRAJECTORY_Y, z * scale]
}

export function projectParticleToScene(position: { x: number; y: number }): Point3 {
  return clampPointToChamber(position.x * SCENE_SCALE, position.y * SCENE_SCALE)
}
