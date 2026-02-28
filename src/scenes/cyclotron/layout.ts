export type Point3 = [number, number, number]

const SCENE_SCALE = 3200
export const SCENE_Y = 0.24
export const DEE_THICKNESS = 0.14
export const DEE_TOP_Y = SCENE_Y + DEE_THICKNESS / 2
export const TRAJECTORY_Y = DEE_TOP_Y + 0.004
const MAX_VISUAL_RADIUS = 2.28
const MIN_GAP_WIDTH_SCENE = 0.06
const MAX_GAP_WIDTH_SCENE = 0.28

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(maxValue, Math.max(minValue, value))
}

export function deriveGapWidthScene(gapHalfWidthM: number): number {
  const width = Math.abs(gapHalfWidthM) * 2 * SCENE_SCALE
  return clamp(width, MIN_GAP_WIDTH_SCENE, MAX_GAP_WIDTH_SCENE)
}

function clampPointToChamber(x: number, z: number, maxRadius = MAX_VISUAL_RADIUS): Point3 {
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
