import { Vector2, type Vector3Tuple } from 'three'

export const POTENTIAL_SURFACE_FULL_ANGLE = Math.PI * 2

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
  const sampleCount = Math.max(6, Math.round(options.sampleCount ?? 60))
  const radiusStep = Math.max(0.05, options.radiusStep ?? 0.3)
  const fieldScale = options.fieldScale ?? 12
  const maxAbsPotential = Math.max(1, options.maxAbsPotential ?? 18)

  const points: PotentialSlicePoint[] = []
  for (let index = 1; index <= sampleCount; index += 1) {
    const radius = index * radiusStep
    const potential = chargeSign * (fieldScale / radius)
    const clampedPotential = Math.max(-maxAbsPotential, Math.min(maxAbsPotential, potential))
    points.push({ radius, potential: clampedPotential })
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
