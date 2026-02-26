import type { Point3 } from './layout'

const MIN_TRAIL_STEP = 0.008
const MAX_TRAIL_STEP = 0.62

function planarDistance(a: Point3, b: Point3): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2])
}

export function appendTrailPoint(previous: Point3[], nextPoint: Point3, maxPoints: number): Point3[] {
  const last = previous[previous.length - 1]
  if (!last) {
    return [nextPoint]
  }

  const distance = planarDistance(last, nextPoint)
  if (distance < MIN_TRAIL_STEP) {
    return previous
  }

  // A sudden jump means camera-clamp discontinuity or a sim reset; avoid drawing a long chord.
  if (distance > MAX_TRAIL_STEP) {
    return [nextPoint]
  }

  const next = [...previous, nextPoint]
  if (next.length <= maxPoints) {
    return next
  }
  return next.slice(next.length - maxPoints)
}
