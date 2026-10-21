type FocusPoint = [number, number, number]

/** What the camera should favour: everything, one point (focus), or the midpoint of two (compare). */
export type PresentationFocus = {
  mode: 'overview' | 'focus' | 'compare'
  primary?: FocusPoint
  secondary?: FocusPoint
}

type FramingTarget = {
  x: number
  y: number
  z: number
}

function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha
}

/** The orbit target for a focus: 60 % of the way to the primary point, or between primary and secondary. */
export function resolvePresentationCameraTarget({
  baseTarget,
  mode,
  primary,
  secondary,
}: PresentationFocus & { baseTarget: FramingTarget }): FramingTarget {
  if (mode === 'overview' || !primary) {
    return baseTarget
  }

  if (mode === 'focus') {
    return {
      x: lerp(baseTarget.x, primary[0], 0.6),
      y: lerp(baseTarget.y, primary[1], 0.6),
      z: lerp(baseTarget.z, primary[2], 0.6),
    }
  }

  if (mode === 'compare' && secondary) {
    return {
      x: (primary[0] + secondary[0]) / 2,
      y: (primary[1] + secondary[1]) / 2,
      z: (primary[2] + secondary[2]) / 2,
    }
  }

  return baseTarget
}
