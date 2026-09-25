import type { VernierDivisions } from './model'
import { MICROMETER_PITCH_MM } from './model'

/** Millimetre poses from resistivity-3d.js `buildCaliper` / `buildMicrometer` update(). */

export type CaliperMeasure = 'outer' | 'inner' | 'depth'
export type ViewPreset = 'home' | 'front' | 'top' | 'focus'
export type InstrumentTool = 'caliper' | 'micrometer'

export type Vec3 = [number, number, number]

export type OrbitView = {
  target: Vec3
  azimuth: number
  elevation: number
  radius: number
}

export type CaliperPose = {
  frame: Vec3
  rodZ: number
  screw: Vec3
  screwHeadRotationY: number
  workZ: number
  depthRoot: Vec3
  rootRotationZ: number
  rootPosition: Vec3
  groundY: number
  showDepthWork: boolean
}

export type MicrometerPose = {
  reading: number
  spindleX: number
  spindleTipX: number
  thimbleX: number
  thimbleY: number
  thimbleRotationX: number
  anvilX: number
  anvilTipX: number
  bossLX: number
  sleeveX: number
  sleeveScaleX: number
  lock: Vec3
  leverRotationY: number
  objectZ: number
}

export const CALIPER_CAMERA = {
  fov: 26,
  near: 5,
  far: 9000,
  minDistance: 70,
  maxDistance: 950,
  minPolarAngle: 0.05,
  maxPolarAngle: Math.PI - 0.08,
} as const

export const MICROMETER_CAMERA = {
  fov: 26,
  near: 2,
  far: 5000,
  minDistance: 40,
  maxDistance: 420,
  minPolarAngle: 0.05,
  maxPolarAngle: Math.PI - 0.08,
} as const

export const MICROMETER_ZERO_X = 44
export const MICROMETER_REF_RAD = 28 * Math.PI / 180

export function caliperPose(input: {
  x: number
  exploded: number
  locked: boolean
  mode: CaliperMeasure
}): CaliperPose {
  const exploded = input.exploded
  const depth = input.mode === 'depth'
  return {
    frame: [input.x, 0, 30 * exploded],
    rodZ: -1.05 - 44 * exploded,
    screw: [34, 20 + 12 * exploded, 0.2],
    screwHeadRotationY: input.locked ? 0.9 : 0,
    workZ: -46 * exploded,
    depthRoot: [7.8, 0, -46 * exploded],
    rootRotationZ: depth ? -Math.PI / 2 : 0,
    rootPosition: depth ? [0, 215, 0] : [0, 0, 0],
    groundY: depth ? -46 : -62,
    showDepthWork: depth,
  }
}

export function micrometerPose(input: {
  gap: number
  zero: number
  exploded: number
  locked: boolean
}): MicrometerPose {
  const exploded = input.exploded
  const reading = input.gap + input.zero
  const shift = 16 * exploded
  return {
    reading,
    spindleX: input.gap + 22 + shift * 0.5,
    spindleTipX: input.gap + 0.4 + shift * 0.5,
    thimbleX: MICROMETER_ZERO_X + reading + 16 * exploded,
    thimbleY: 0,
    thimbleRotationX: (2 * Math.PI * reading) / MICROMETER_PITCH_MM,
    anvilX: -4.5 - 14 * exploded,
    anvilTipX: -0.4 - 14 * exploded,
    bossLX: -14 - 14 * exploded,
    sleeveX: 57.5 + 8 * exploded,
    sleeveScaleX: 8 * exploded,
    lock: [32, 6.4 + 10 * exploded, 0],
    leverRotationY: input.locked ? -1.2 : 0,
    objectZ: -30 * exploded,
  }
}

export function orbitPosition(view: OrbitView): Vec3 {
  const cosine = Math.cos(view.elevation)
  return [
    view.target[0] + view.radius * cosine * Math.sin(view.azimuth),
    view.target[1] + view.radius * Math.sin(view.elevation),
    view.target[2] + view.radius * cosine * Math.cos(view.azimuth),
  ]
}

export function instrumentView(input: {
  tool: InstrumentTool
  mode: CaliperMeasure
  preset: ViewPreset
  caliperX: number
  reading: number
}): OrbitView {
  if (input.tool === 'micrometer') {
    if (input.preset === 'focus') {
      return { target: [MICROMETER_ZERO_X + input.reading - 1, 1.5, 0], azimuth: 0.02, elevation: 0.42, radius: 64 }
    }
    if (input.preset === 'top') return { target: [30, -3, 0], azimuth: 0, elevation: 1.45, radius: 160 }
    if (input.preset === 'front') return { target: [30, -3, 0], azimuth: 0, elevation: 0.03, radius: 145 }
    return { target: [30, -3, 0], azimuth: 0.1, elevation: 0.34, radius: 150 }
  }

  const depth = input.mode === 'depth'
  if (input.preset === 'focus') {
    return depth
      ? { target: [4, 12 - input.caliperX, 0], azimuth: 0.5, elevation: 0.28, radius: 170 }
      : { target: [input.caliperX + 16, 2, 0], azimuth: 0.06, elevation: 0.2, radius: 160 }
  }
  if (input.preset === 'top') {
    return depth
      ? { target: [0, 95, 0], azimuth: 0, elevation: 1.45, radius: 640 }
      : { target: [95, -4, 0], azimuth: 0, elevation: 1.45, radius: 320 }
  }
  if (input.preset === 'front') {
    return depth
      ? { target: [0, 95, 0], azimuth: 0, elevation: 0.02, radius: 640 }
      : { target: [95, -4, 0], azimuth: 0, elevation: 0.02, radius: 290 }
  }
  return depth
    ? { target: [0, 95, 0], azimuth: 0.35, elevation: 0.22, radius: 640 }
    : { target: [95, -4, 0], azimuth: 0.12, elevation: 0.3, radius: 300 }
}

export function cameraLimits(tool: InstrumentTool) {
  return tool === 'caliper' ? CALIPER_CAMERA : MICROMETER_CAMERA
}

export function vernierLabelEvery(n: VernierDivisions): number {
  return n === 20 ? 4 : 5
}
