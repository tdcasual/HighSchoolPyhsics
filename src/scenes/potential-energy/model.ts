import { Vector2, type Vector3Tuple } from 'three'

export const POTENTIAL_SURFACE_FULL_ANGLE = Math.PI * 2
export const POTENTIAL_FIELD_SCALE = 12
export const POTENTIAL_DISPLAY_LIMIT = 18
export const POTENTIAL_DISPLAY_MIN_RADIUS = POTENTIAL_FIELD_SCALE / POTENTIAL_DISPLAY_LIMIT

export type PotentialSlicePoint = {
  radius: number
  potential: number
}

export type PotentialSliceStats = {
  sign: 'positive' | 'negative'
  minPotential: number
  maxPotential: number
  sampleCount: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function buildPotentialSlicePoints(
  chargeSign: 1 | -1,
  options: {
    sampleCount?: number
    radiusStep?: number
    fieldScale?: number
    maxAbsPotential?: number
  } = {},
): PotentialSlicePoint[] {
  const requestedSampleCount = options.sampleCount ?? 60
  const requestedRadiusStep = options.radiusStep ?? 0.3
  const requestedFieldScale = options.fieldScale ?? POTENTIAL_FIELD_SCALE
  const requestedLimit = options.maxAbsPotential ?? POTENTIAL_DISPLAY_LIMIT
  const sampleCount = Number.isFinite(requestedSampleCount) ? Math.max(6, Math.round(requestedSampleCount)) : 60
  const radiusStep = Number.isFinite(requestedRadiusStep) ? Math.max(0.05, Math.abs(requestedRadiusStep)) : 0.3
  const fieldScale = Number.isFinite(requestedFieldScale) ? Math.abs(requestedFieldScale) : POTENTIAL_FIELD_SCALE
  const maxAbsPotential = Number.isFinite(requestedLimit) ? Math.max(1, Math.abs(requestedLimit)) : POTENTIAL_DISPLAY_LIMIT
  const minimumRadius = fieldScale > 0 ? fieldScale / maxAbsPotential : 0.05

  const points: PotentialSlicePoint[] = []
  for (let index = 0; index < sampleCount; index += 1) {
    const radius = minimumRadius + index * radiusStep
    const potential = fieldScale > 0 ? chargeSign * (fieldScale / radius) : 0
    points.push({ radius, potential })
  }

  return points
}

export function buildPotentialCurveGeometryPoints(
  slicePoints: ReadonlyArray<PotentialSlicePoint>,
): Vector3Tuple[] {
  return slicePoints.map((point) => [point.radius, point.potential, 0])
}

export function buildLatheProfile(slicePoints: ReadonlyArray<PotentialSlicePoint>): Vector2[] {
  return slicePoints.map((point) => new Vector2(point.radius, point.potential))
}

export function resolveLatheDrawCount(
  sweepAngle: number,
  options: {
    radialSegments: number
    profilePointCount: number
  },
): number {
  const radialSegments = Math.max(3, Math.round(options.radialSegments))
  const profilePointCount = Math.max(2, Math.round(options.profilePointCount))
  const normalized = clamp(sweepAngle / POTENTIAL_SURFACE_FULL_ANGLE, 0.01, 1)
  const visibleSegments = Math.max(1, Math.round(radialSegments * normalized))
  return visibleSegments * (profilePointCount - 1) * 6
}

export function summarizeSlice(slicePoints: ReadonlyArray<PotentialSlicePoint>): PotentialSliceStats {
  let minPotential = Number.POSITIVE_INFINITY
  let maxPotential = Number.NEGATIVE_INFINITY

  for (const point of slicePoints) {
    if (point.potential < minPotential) {
      minPotential = point.potential
    }
    if (point.potential > maxPotential) {
      maxPotential = point.potential
    }
  }

  if (slicePoints.length === 0) {
    return {
      sign: 'positive',
      minPotential: 0,
      maxPotential: 0,
      sampleCount: 0,
    }
  }

  return {
    sign: maxPotential >= 0 ? 'positive' : 'negative',
    minPotential,
    maxPotential,
    sampleCount: slicePoints.length,
  }
}
