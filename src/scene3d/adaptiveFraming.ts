type FramingTarget = {
  x: number
  y: number
  z: number
}

export type AdaptiveFramingOptions = {
  shiftX: number
  shiftY: number
  zoomInShiftX: number
  zoomInShiftY: number
  zoomStartDistance?: number
  zoomEndDistance?: number
  zoomInEndDistance?: number
}

type ResolveAdaptiveFramingTargetInput = {
  baseTarget: FramingTarget
  distance: number
  zoomStartDistance: number
  zoomEndDistance: number
  zoomInEndDistance?: number
  shiftX: number
  shiftY: number
  zoomInShiftX?: number
  zoomInShiftY?: number
}

export const DEFAULT_ADAPTIVE_FRAMING: AdaptiveFramingOptions = {
  shiftX: 1.0,
  shiftY: 1.0,
  zoomInShiftX: 0.4,
  zoomInShiftY: 0.5,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function resolveProgress(distance: number, startDistance: number, endDistance: number): number | null {
  if (
    !Number.isFinite(distance) ||
    !Number.isFinite(startDistance) ||
    !Number.isFinite(endDistance) ||
    Math.abs(endDistance - startDistance) <= 1e-6
  ) {
    return null
  }

  return clamp((distance - startDistance) / (endDistance - startDistance), 0, 1)
}

export function resolveAdaptiveFramingTarget({
  baseTarget,
  distance,
  zoomStartDistance,
  zoomEndDistance,
  zoomInEndDistance,
  shiftX,
  shiftY,
  zoomInShiftX = 0,
  zoomInShiftY = 0,
}: ResolveAdaptiveFramingTargetInput): FramingTarget {
  if (!Number.isFinite(distance) || !Number.isFinite(zoomStartDistance)) {
    return baseTarget
  }

  if (distance > zoomStartDistance) {
    const zoomOutProgress = resolveProgress(distance, zoomStartDistance, zoomEndDistance)
    if (zoomOutProgress === null) {
      return baseTarget
    }

    return {
      x: baseTarget.x + shiftX * zoomOutProgress,
      y: baseTarget.y - shiftY * zoomOutProgress,
      z: baseTarget.z,
    }
  }

  const resolvedZoomInEndDistance = Number.isFinite(zoomInEndDistance) ? Number(zoomInEndDistance) : null
  if (distance < zoomStartDistance && resolvedZoomInEndDistance !== null) {
    const zoomInProgress = resolveProgress(distance, zoomStartDistance, resolvedZoomInEndDistance)
    if (zoomInProgress === null) {
      return baseTarget
    }

    return {
      x: baseTarget.x + zoomInShiftX * zoomInProgress,
      y: baseTarget.y - zoomInShiftY * zoomInProgress,
      z: baseTarget.z,
    }
  }

  return {
    x: baseTarget.x,
    y: baseTarget.y,
    z: baseTarget.z,
  }
}
