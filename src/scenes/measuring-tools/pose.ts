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
export const CALIPER_INNER_CONTACT_Y = 31.5
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
    thimbleX: MICROMETER_ZERO_X + input.gap + 16 * exploded,
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

export type Bounds3 = { min: Vec3; max: Vec3 }

export type InstrumentViewInput = {
  tool: InstrumentTool
  mode: CaliperMeasure
  preset: ViewPreset
  caliperX: number
  reading: number
  caliperExplode?: number
  micrometerExplode?: number
  showWork?: boolean
  workSize?: number
  /** Width/height available for the instrument after overlay panels are accounted for. */
  aspect?: number
  /** Horizontal shift from the canvas center to the unobstructed instrument area, in CSS pixels. */
  centerOffsetPixels?: number
  viewportHeight?: number
}

function bounds(min: Vec3, max: Vec3): Bounds3 {
  return { min, max }
}

function mergeBounds(...items: Bounds3[]): Bounds3 {
  return {
    min: [
      Math.min(...items.map((item) => item.min[0])),
      Math.min(...items.map((item) => item.min[1])),
      Math.min(...items.map((item) => item.min[2])),
    ],
    max: [
      Math.max(...items.map((item) => item.max[0])),
      Math.max(...items.map((item) => item.max[1])),
      Math.max(...items.map((item) => item.max[2])),
    ],
  }
}

function transformCaliperDepthBounds(source: Bounds3): Bounds3 {
  const corners: Vec3[] = []
  for (const x of [source.min[0], source.max[0]]) {
    for (const y of [source.min[1], source.max[1]]) {
      for (const z of [source.min[2], source.max[2]]) {
        // caliper-root rotates by -90° around Z, then shifts up to the depth-view origin.
        corners.push([y, 215 - x, z])
      }
    }
  }
  return bounds(
    [
      Math.min(...corners.map((point) => point[0])),
      Math.min(...corners.map((point) => point[1])),
      Math.min(...corners.map((point) => point[2])),
    ],
    [
      Math.max(...corners.map((point) => point[0])),
      Math.max(...corners.map((point) => point[1])),
      Math.max(...corners.map((point) => point[2])),
    ],
  )
}

export function instrumentBounds(input: InstrumentViewInput): Bounds3 {
  if (input.preset === 'focus') {
    if (input.tool === 'micrometer') {
      const explode = Math.max(0, Math.min(1, input.micrometerExplode ?? 0))
      const reading = Math.max(0, Math.min(25, input.reading))
      const centerX = MICROMETER_ZERO_X + reading + 12 * explode
      const scale = bounds([centerX - 36, -27, -14], [centerX + 36, 27, 14])
      if (!input.showWork) return scale
      const size = Math.max(0, Math.min(25, input.workSize ?? reading))
      const workZ = -30 * explode
      return mergeBounds(scale, bounds([0, -size / 2 - 2, workZ - 14], [size, size / 2 + 2, workZ + 14]))
    }

    const explode = Math.max(0, Math.min(1, input.caliperExplode ?? 0))
    const read = Math.max(0, Math.min(150, input.caliperX))
    let focused = bounds([read - 18, -18, -5 - 49 * explode], [read + 18, 33, 5 + 30 * explode])
    if (input.showWork && input.mode === 'inner') {
      const size = Math.max(0, Math.min(150, input.workSize ?? read))
      const outerRadius = size / 2 + 2.2
      const workZ = -46 * explode
      focused = mergeBounds(
        focused,
        bounds(
          [-3, CALIPER_INNER_CONTACT_Y - outerRadius - 1, workZ - 3],
          [size + 3, CALIPER_INNER_CONTACT_Y + outerRadius + 1, workZ + 3],
        ),
      )
    }
    if (input.mode === 'depth') {
      focused = transformCaliperDepthBounds(focused)
      if (input.showWork) {
        const size = Math.max(0, Math.min(150, input.workSize ?? read))
        const workZ = -46 * explode
        focused = mergeBounds(focused, bounds([-23, -size - 1, workZ - 16], [38, 1, workZ]))
      }
    }
    return focused
  }

  if (input.tool === 'micrometer') {
    const explode = Math.max(0, Math.min(1, input.micrometerExplode ?? 0))
    const read = Math.max(0, Math.min(25, input.reading))
    const full = bounds(
      [-36 - 14 * explode, -31 - 10 * explode, -15],
      [MICROMETER_ZERO_X + read + 40 + 16 * explode, 31 + 12 * explode, 15],
    )
    if (!input.showWork) return full
    const size = Math.max(0, Math.min(25, input.workSize ?? read))
    return mergeBounds(full, bounds([0, -size / 2 - 2, -30 * explode - 14], [size, size / 2 + 2, -30 * explode + 14]))
  }

  const explode = Math.max(0, Math.min(1, input.caliperExplode ?? 0))
  const read = Math.max(0, Math.min(150, input.caliperX))
  const zMin = -5 - 49 * explode
  const zMax = 5 + 30 * explode
  const main = bounds([-30, -44 - 12 * explode, zMin], [Math.max(220, read + 74), 40 + 12 * explode, zMax])
  if (input.mode === 'depth') {
    let result = transformCaliperDepthBounds(main)
    if (input.showWork) {
      const size = Math.max(0, Math.min(150, input.workSize ?? read))
      const workZ = -46 * explode
      result = mergeBounds(result, bounds([-23, -size - 1, workZ - 16], [38, 1, workZ]))
    }
    return result
  }

  if (!input.showWork) return main
  const size = Math.max(0, Math.min(150, input.workSize ?? read))
  const workZ = -46 * explode
  if (input.mode === 'inner') {
    const outerRadius = size / 2 + 2.2
    return mergeBounds(main, bounds([-3, CALIPER_INNER_CONTACT_Y - outerRadius - 1, workZ - 3], [size + 3, CALIPER_INNER_CONTACT_Y + outerRadius + 1, workZ + 3]))
  }
  return mergeBounds(main, bounds([-1, -7 - size, workZ - 19], [size + 1, -6, workZ + 19]))
}

function boundsCenter(value: Bounds3): Vec3 {
  return [
    (value.min[0] + value.max[0]) / 2,
    (value.min[1] + value.max[1]) / 2,
    (value.min[2] + value.max[2]) / 2,
  ]
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/** Returns the perspective distance required to fit every AABB corner into a safe viewport. */
export function fitCameraDistance(input: {
  bounds: Bounds3
  target: Vec3
  azimuth: number
  elevation: number
  fov: number
  aspect: number
  margin?: number
  minDistance?: number
}): number {
  const verticalTangent = Math.tan((input.fov * Math.PI) / 360)
  const horizontalTangent = verticalTangent * Math.max(0.03, input.aspect)
  const sine = Math.sin(input.elevation)
  const cosine = Math.cos(input.elevation)
  const forward: Vec3 = [cosine * Math.sin(input.azimuth), sine, cosine * Math.cos(input.azimuth)]
  const right: Vec3 = [Math.cos(input.azimuth), 0, -Math.sin(input.azimuth)]
  const up: Vec3 = [-sine * Math.sin(input.azimuth), cosine, -sine * Math.cos(input.azimuth)]
  let required = 0

  for (const x of [input.bounds.min[0], input.bounds.max[0]]) {
    for (const y of [input.bounds.min[1], input.bounds.max[1]]) {
      for (const z of [input.bounds.min[2], input.bounds.max[2]]) {
        const relative: Vec3 = [x - input.target[0], y - input.target[1], z - input.target[2]]
        const depth = dot(relative, forward)
        const horizontal = Math.abs(dot(relative, right))
        const vertical = Math.abs(dot(relative, up))
        required = Math.max(
          required,
          depth + horizontal / horizontalTangent,
          depth + vertical / verticalTangent,
        )
      }
    }
  }

  return Math.max(input.minDistance ?? 0, required * (input.margin ?? 1.16))
}

export function instrumentView(input: InstrumentViewInput): OrbitView {
  const depth = input.tool === 'caliper' && input.mode === 'depth'
  const focus = input.preset === 'focus'
  const azimuth = focus
    ? (input.tool === 'micrometer' ? 0.02 : depth ? 0.16 : 0.06)
    : input.preset === 'top'
      ? 0
      : input.preset === 'front'
        ? 0
        : input.tool === 'micrometer' ? 0.1 : depth ? 0.2 : 0.12
  const elevation = focus
    ? (input.tool === 'micrometer' ? 0.34 : depth ? 0.2 : 0.16)
    : input.preset === 'top'
      ? 1.45
      : input.preset === 'front'
        ? 0.03
        : input.tool === 'micrometer' ? 0.34 : depth ? 0.2 : 0.3
  const frameBounds = instrumentBounds(input)
  const center = boundsCenter(frameBounds)
  const limits = cameraLimits(input.tool)
  const radius = fitCameraDistance({
    bounds: frameBounds,
    target: center,
    azimuth,
    elevation,
    fov: limits.fov,
    aspect: input.aspect ?? 16 / 9,
    minDistance: limits.minDistance,
    margin: focus ? 1.02 : input.tool === 'micrometer' ? 1 : 1.16,
  })
  const viewportHeight = Math.max(1, input.viewportHeight ?? 720)
  const shift = (input.centerOffsetPixels ?? 0) * (2 * radius * Math.tan((limits.fov * Math.PI) / 360)) / viewportHeight
  const screenRight: Vec3 = [Math.cos(azimuth), 0, -Math.sin(azimuth)]
  const target: Vec3 = [
    center[0] - screenRight[0] * shift,
    center[1],
    center[2] - screenRight[2] * shift,
  ]
  return { target, azimuth, elevation, radius }
}

export function cameraLimits(tool: InstrumentTool) {
  return tool === 'caliper' ? CALIPER_CAMERA : MICROMETER_CAMERA
}

export function vernierLabelEvery(n: VernierDivisions): number {
  return n === 20 ? 4 : 5
}
