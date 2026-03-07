export type FocusPoint = [number, number, number]
export type PresentationFocusMode = 'overview' | 'focus' | 'compare' | 'follow'

export type PresentationFocus = {
  mode: PresentationFocusMode
  primary?: FocusPoint
  secondary?: FocusPoint
}

type FramingTarget = {
  x: number
  y: number
  z: number
}

type ResolvePresentationCameraTargetInput = {
  baseTarget: FramingTarget
  mode: PresentationFocusMode
  primary?: FocusPoint
  secondary?: FocusPoint
}

type ResolvePresentationCameraDistanceHintInput = {
  baseDistance: number
  mode: PresentationFocusMode
}

function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha
}

export function resolvePresentationCameraTarget({
  baseTarget,
  mode,
  primary,
  secondary,
}: ResolvePresentationCameraTargetInput): FramingTarget {
  if (mode === 'overview' || !primary) {
    return baseTarget
  }

  if (mode === 'focus' || mode === 'follow') {
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

export function resolvePresentationCameraDistanceHint({
  baseDistance,
  mode,
}: ResolvePresentationCameraDistanceHintInput): number {
  if (mode === 'focus' || mode === 'follow') {
    return baseDistance * 0.85
  }

  if (mode === 'compare') {
    return baseDistance * 1.05
  }

  return baseDistance
}
