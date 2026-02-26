export type CanvasQualityProfile = {
  dpr: [number, number]
  antialias: boolean
}

function readDeviceMemory(): number | null {
  if (typeof navigator === 'undefined') {
    return null
  }
  const nav = navigator as Navigator & { deviceMemory?: number }
  return typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null
}

function hasCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(pointer: coarse)').matches
}

export function resolveCanvasQualityProfile(): CanvasQualityProfile {
  const lowMemory = readDeviceMemory()
  const lowPowerDevice = hasCoarsePointer() || (lowMemory !== null && lowMemory <= 4)

  if (lowPowerDevice) {
    return {
      dpr: [1, 1.25],
      antialias: false,
    }
  }

  return {
    dpr: [1, 1.75],
    antialias: true,
  }
}
