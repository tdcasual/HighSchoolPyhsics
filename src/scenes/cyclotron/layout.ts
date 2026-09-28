export type Point3 = [number, number, number]

const SCENE_SCALE = 3200
export const SCENE_Y = 0.24
export const DEE_THICKNESS = 0.14
export const DEE_RADIUS = 2.16
export const MAX_ORBIT_RADIUS_M = DEE_RADIUS / SCENE_SCALE
export const DEE_TOP_Y = SCENE_Y + DEE_THICKNESS / 2
export const TRAJECTORY_Y = DEE_TOP_Y + 0.004
const MIN_VISUAL_GAP_WIDTH = 0.064
const MAX_VISUAL_GAP_WIDTH = 0.128
const MIN_GAP_HALF_WIDTH_M = 0.005e-3
const MAX_GAP_HALF_WIDTH_M = 0.02e-3

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(maxValue, Math.max(minValue, value))
}

export function deriveGapWidthScene(gapHalfWidthM: number): number {
  const ratio = clamp(
    (Math.abs(gapHalfWidthM) - MIN_GAP_HALF_WIDTH_M) /
      (MAX_GAP_HALF_WIDTH_M - MIN_GAP_HALF_WIDTH_M),
    0,
    1,
  )
  return MIN_VISUAL_GAP_WIDTH + ratio * (MAX_VISUAL_GAP_WIDTH - MIN_VISUAL_GAP_WIDTH)
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
