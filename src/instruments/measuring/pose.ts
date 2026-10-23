import { CALIPER_RANGE_MM, MICROMETER_PITCH_MM } from './model'
import {
  boundsCenter,
  bounds,
  fitOrbitView,
  mergeBounds,
  type Bounds3,
  type FramingArea,
  type OrbitView,
  type Vec3,
  type ViewPreset,
} from '../../scene3d/orbitFraming'

export {
  fitCameraDistance,
  orbitPosition,
  type Bounds3,
  type OrbitView,
  type Vec3,
  type ViewPreset,
} from '../../scene3d/orbitFraming'

/** Millimetre poses from resistivity-3d.js `buildCaliper` / `buildMicrometer` update(). */

export type CaliperMeasure = 'outer' | 'inner' | 'depth'
export type InstrumentTool = 'caliper' | 'micrometer'

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
/** Caliper explode: the frame drops below the beam and comes forward, visible from the front. */
export const CALIPER_EXPLODE_DROP = 28
export const CALIPER_EXPLODE_FORWARD = 22
export const CALIPER_INNER_CONTACT_Y = 31.5
export const MICROMETER_REF_RAD = (28 * Math.PI) / 180

export function caliperPose(input: {
  x: number
  exploded: number
  locked: boolean
  mode: CaliperMeasure
}): CaliperPose {
  const exploded = input.exploded
  const depth = input.mode === 'depth'
  return {
    frame: [input.x, 0 - CALIPER_EXPLODE_DROP * exploded, CALIPER_EXPLODE_FORWARD * exploded],
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
    // The thimble edge and its scale are one rigid part: a zero error shifts both, so the
    // edge always sits at the indicated reading on the sleeve, not at the physical gap.
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

export type InstrumentViewInput = FramingArea & {
  tool: InstrumentTool
  mode: CaliperMeasure
  preset: ViewPreset
  caliperX: number
  /** Vernier length in mm (9, 19 or 49); the focus view frames the whole vernier. */
  vernierSpan?: number
  reading: number
  caliperExplode?: number
  micrometerExplode?: number
  showWork?: boolean
  workSize?: number
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
      // The reading zone: sleeve graduations left of the thimble edge plus the thimble numbers.
      const edge = MICROMETER_ZERO_X + reading + 16 * explode
      // Scales only: practice questions open here, and a specimen up to 25 mm across would
      // shrink the 0.01 mm graduations below what the back row can read.
      return bounds([edge - 15, -9, -8], [edge + 13, 10, 8])
    }

    const explode = Math.max(0, Math.min(1, input.caliperExplode ?? 0))
    const read = Math.max(0, Math.min(150, input.caliperX))
    const span = input.vernierSpan ?? 19
    let focused = bounds(
      [read - 10, -18 - CALIPER_EXPLODE_DROP * explode, -5 - 49 * explode],
      [read + span + 14, 33, 5 + CALIPER_EXPLODE_FORWARD * explode],
    )
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
    // Frame the whole travel so turning the thimble never re-fits (and resets) the camera.
    const full = bounds(
      [-36 - 14 * explode, -31 - 10 * explode, -15],
      [MICROMETER_ZERO_X + 25 + 40 + 16 * explode, 31 + 12 * explode, 15],
    )
    if (!input.showWork) return full
    const size = Math.max(0, Math.min(25, input.workSize ?? input.reading))
    return mergeBounds(full, bounds([0, -size / 2 - 2, -30 * explode - 14], [size, size / 2 + 2, -30 * explode + 14]))
  }

  const explode = Math.max(0, Math.min(1, input.caliperExplode ?? 0))
  const read = Math.max(0, Math.min(150, input.caliperX))
  const zMin = -5 - 49 * explode
  const zMax = 5 + CALIPER_EXPLODE_FORWARD * explode
  // The depth rod leaves the beam end (x = 215) by exactly the reading.
  const rodTip = 215 + read + 2
  const main = bounds(
    [-30, -44 - CALIPER_EXPLODE_DROP * explode, zMin],
    [Math.max(CALIPER_RANGE_MM + 74, rodTip), 40 + 12 * explode, zMax],
  )
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
    return mergeBounds(
      main,
      bounds(
        [-3, CALIPER_INNER_CONTACT_Y - outerRadius - 1, workZ - 3],
        [size + 3, CALIPER_INNER_CONTACT_Y + outerRadius + 1, workZ + 3],
      ),
    )
  }
  return mergeBounds(main, bounds([-1, -7 - size, workZ - 19], [size + 1, -6, workZ + 19]))
}

export function instrumentView(input: InstrumentViewInput): OrbitView {
  const depth = input.tool === 'caliper' && input.mode === 'depth'
  const focus = input.preset === 'focus'
  const azimuth = focus
    ? input.tool === 'micrometer'
      ? 0.02
      : depth
        ? 0.16
        : 0.06
    : input.preset === 'top'
      ? 0
      : input.preset === 'front'
        ? 0
        : input.tool === 'micrometer'
          ? 0.1
          : depth
            ? 0.2
            : 0.12
  const elevation = focus
    ? input.tool === 'micrometer'
      ? 0.34
      : depth
        ? 0.2
        : 0.16
    : input.preset === 'top'
      ? // Both instruments stand on edge facing +z: a straight-down view only shows a 3.5 mm
        // edge, so 俯视 looks down at ~55° to show thickness, the slider and the lock.
        0.95
      : input.preset === 'front'
        ? 0.03
        : input.tool === 'micrometer'
          ? 0.34
          : depth
            ? 0.2
            : 0.3
  const limits = cameraLimits(input.tool)
  // Orbit around the reading zone so zooming closes in on the scale. Overview presets use a fixed
  // anchor (mid-travel micrometer scale, the 0–50 mm vernier zone) so turning the thimble or
  // sliding the frame never re-fits and resets the user's zoom.
  const anchorInput = focus ? input : { ...input, reading: 12.5, caliperX: 25 }
  return fitOrbitView({
    ...input,
    bounds: instrumentBounds(input),
    anchor: boundsCenter(instrumentBounds({ ...anchorInput, preset: 'focus', showWork: false })),
    azimuth,
    elevation,
    fov: limits.fov,
    minDistance: limits.minDistance,
    margin: focus ? 1.02 : input.tool === 'micrometer' ? 1 : 1.08,
  })
}

export function cameraLimits(tool: InstrumentTool) {
  return tool === 'caliper' ? CALIPER_CAMERA : MICROMETER_CAMERA
}
