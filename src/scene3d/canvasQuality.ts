export type PerformanceLevel = 'high' | 'medium' | 'low'

export type CanvasQualityProfile = {
  dpr: [number, number]
  antialias: boolean
}

export type GeometryDetail = {
  sphereSegments: number
  tubeRadialSegments: number
  cylinderRadialSegments: number
  coneRadialSegments: number
  torusRadialSegments: number
  torusTubularSegments: number
  circleSegments: number
}

export type PerformanceProfile = {
  level: PerformanceLevel
  canvas: CanvasQualityProfile
  geometry: GeometryDetail
  shadowMapSize: number | null
  mhdCarrierCountBase: number
  mhdCarrierCountScale: number
  equipotentialMaxPointsPerSurface: number
  electrostaticTerrainResolution: number
  inductionCoilCurveSegments: number
  inductionCoilTubularSegments: number
  inductionWireTubularSegments: number
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

function detectPerformanceLevel(): PerformanceLevel {
  const memory = readDeviceMemory()
  const isCoarse = hasCoarsePointer()

  if (isCoarse) {
    return 'low'
  }

  if (memory !== null && memory <= 4) {
    return 'low'
  }

  const cores = typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator
    ? (navigator as Navigator & { hardwareConcurrency: number }).hardwareConcurrency
    : null

  if (cores !== null && cores <= 4) {
    return 'medium'
  }

  return 'high'
}

const PROFILE_CONFIG: Record<PerformanceLevel, PerformanceProfile> = {
  high: {
    level: 'high',
    canvas: { dpr: [1, 1.75], antialias: true },
    geometry: {
      sphereSegments: 24,
      tubeRadialSegments: 8,
      cylinderRadialSegments: 16,
      coneRadialSegments: 18,
      torusRadialSegments: 16,
      torusTubularSegments: 32,
      circleSegments: 32,
    },
    shadowMapSize: 2048,
    mhdCarrierCountBase: 5,
    mhdCarrierCountScale: 6,
    equipotentialMaxPointsPerSurface: 1200,
    electrostaticTerrainResolution: 80,
    inductionCoilCurveSegments: 500,
    inductionCoilTubularSegments: 400,
    inductionWireTubularSegments: 64,
  },
  medium: {
    level: 'medium',
    canvas: { dpr: [1, 1.25], antialias: false },
    geometry: {
      sphereSegments: 16,
      tubeRadialSegments: 6,
      cylinderRadialSegments: 12,
      coneRadialSegments: 12,
      torusRadialSegments: 12,
      torusTubularSegments: 24,
      circleSegments: 24,
    },
    shadowMapSize: 1024,
    mhdCarrierCountBase: 4,
    mhdCarrierCountScale: 4,
    equipotentialMaxPointsPerSurface: 600,
    electrostaticTerrainResolution: 50,
    inductionCoilCurveSegments: 300,
    inductionCoilTubularSegments: 250,
    inductionWireTubularSegments: 48,
  },
  low: {
    level: 'low',
    canvas: { dpr: [1, 1.25], antialias: false },
    geometry: {
      sphereSegments: 8,
      tubeRadialSegments: 4,
      cylinderRadialSegments: 8,
      coneRadialSegments: 8,
      torusRadialSegments: 8,
      torusTubularSegments: 16,
      circleSegments: 16,
    },
    shadowMapSize: null,
    mhdCarrierCountBase: 3,
    mhdCarrierCountScale: 3,
    equipotentialMaxPointsPerSurface: 300,
    electrostaticTerrainResolution: 30,
    inductionCoilCurveSegments: 150,
    inductionCoilTubularSegments: 150,
    inductionWireTubularSegments: 32,
  },
}

export function resolvePerformanceProfile(): PerformanceProfile {
  const level = detectPerformanceLevel()
  return PROFILE_CONFIG[level]
}

export function resolveCanvasQualityProfile(): CanvasQualityProfile {
  return resolvePerformanceProfile().canvas
}

export function getGeometryDetail(): GeometryDetail {
  return resolvePerformanceProfile().geometry
}

export function getPerformanceLevel(): PerformanceLevel {
  return resolvePerformanceProfile().level
}
