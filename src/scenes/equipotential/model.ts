export type EquipotentialCharge = {
  id: string
  x: number
  y: number
  z: number
  magnitude: number
}

type FieldSample = {
  x: number
  y: number
  z: number
  potential: number
}

export type EquipotentialSurface = {
  level: number
  isoValue: number
  points: Array<[number, number, number]>
}

export type EquipotentialStats = {
  minPotential: number
  maxPotential: number
  positivePointCount: number
  negativePointCount: number
  positiveChargeCount: number
  negativeChargeCount: number
  dominantPolarity: 'positive' | 'negative' | 'balanced'
}

export type EquipotentialCloudResult = {
  positiveSurfaces: EquipotentialSurface[]
  negativeSurfaces: EquipotentialSurface[]
  stats: EquipotentialStats
}

export type BuildEquipotentialCloudsOptions = {
  charges: ReadonlyArray<EquipotentialCharge>
  bounds: number
  resolution: number
  shellCount: number
  softeningFactor: number
  softPotentialLimit: number
  maxPointsPerSurface?: number
  toleranceRatio?: number
  minTolerance?: number
}

const DEFAULT_MAX_POINTS_PER_SURFACE = 1200
const DEFAULT_TOLERANCE_RATIO = 0.03
const DEFAULT_MIN_TOLERANCE = 0.35

function computeIsoLevels(shellCount: number): number[] {
  const safeCount = Math.max(1, Math.round(shellCount))
  const levels: number[] = []
  const gamma = 1.22
  for (let index = 0; index < safeCount; index += 1) {
    const t = (index + 1) / (safeCount + 1)
    levels.push(Math.pow(t, gamma))
  }
  return levels
}

function clampResolution(resolution: number): number {
  return Math.max(10, Math.min(30, Math.round(resolution)))
}

function downsamplePoints(
  points: Array<[number, number, number]>,
  maxPointsPerSurface: number,
): Array<[number, number, number]> {
  if (points.length <= maxPointsPerSurface) {
    return points
  }

  const stride = Math.ceil(points.length / maxPointsPerSurface)
  const reduced: Array<[number, number, number]> = []
  for (let index = 0; index < points.length; index += stride) {
    reduced.push(points[index])
    if (reduced.length >= maxPointsPerSurface) {
      break
    }
  }
  return reduced
}

function collectSurfacePoints(
  samples: FieldSample[],
  targetIso: number,
  tolerance: number,
  polarity: 'positive' | 'negative',
  maxPointsPerSurface: number,
): Array<[number, number, number]> {
  const points: Array<[number, number, number]> = []
  for (const sample of samples) {
    if (polarity === 'positive' && sample.potential <= 0) {
      continue
    }
    if (polarity === 'negative' && sample.potential >= 0) {
      continue
    }
    if (Math.abs(sample.potential - targetIso) <= tolerance) {
      points.push([sample.x, sample.y, sample.z])
    }
  }

  return downsamplePoints(points, maxPointsPerSurface)
}

export function mapPotentialNonLinear(value: number, softPotentialLimit: number): number {
  const safeLimit = Math.max(1e-4, Math.abs(softPotentialLimit))
  if (!Number.isFinite(value)) {
    return 0
  }
  return safeLimit * Math.tanh(value / safeLimit)
}

export function samplePotentialAtPoint(
  charges: ReadonlyArray<EquipotentialCharge>,
  point: { x: number; y: number; z: number },
  softeningEpsilon: number,
  softPotentialLimit: number,
): number {
  const epsilonSquared = Math.max(1e-6, softeningEpsilon * softeningEpsilon)
  let rawPotential = 0
  for (const charge of charges) {
    const dx = point.x - charge.x
    const dy = point.y - charge.y
    const dz = point.z - charge.z
    rawPotential += charge.magnitude / Math.sqrt(dx * dx + dy * dy + dz * dz + epsilonSquared)
  }

  return mapPotentialNonLinear(rawPotential, softPotentialLimit)
}

export function buildEquipotentialClouds(options: BuildEquipotentialCloudsOptions): EquipotentialCloudResult {
  const {
    charges,
    bounds,
    resolution,
    shellCount,
    softeningFactor,
    softPotentialLimit,
    maxPointsPerSurface = DEFAULT_MAX_POINTS_PER_SURFACE,
    toleranceRatio = DEFAULT_TOLERANCE_RATIO,
    minTolerance = DEFAULT_MIN_TOLERANCE,
  } = options

  const positiveChargeCount = charges.filter((charge) => charge.magnitude > 0).length
  const negativeChargeCount = charges.filter((charge) => charge.magnitude < 0).length

  const emptyStats: EquipotentialStats = {
    minPotential: 0,
    maxPotential: 0,
    positivePointCount: 0,
    negativePointCount: 0,
    positiveChargeCount,
    negativeChargeCount,
    dominantPolarity: 'balanced',
  }

  if (charges.length === 0) {
    return {
      positiveSurfaces: [],
      negativeSurfaces: [],
      stats: emptyStats,
    }
  }

  const safeResolution = clampResolution(resolution)
  const safeBounds = Math.max(1, bounds)
  const step = (safeBounds * 2) / (safeResolution - 1)
  const softeningEpsilon = Math.max(1e-3, softeningFactor * step)

  const samples: FieldSample[] = []
  let minPotential = Number.POSITIVE_INFINITY
  let maxPotential = Number.NEGATIVE_INFINITY

  for (let zIndex = 0; zIndex < safeResolution; zIndex += 1) {
    const z = -safeBounds + zIndex * step
    for (let yIndex = 0; yIndex < safeResolution; yIndex += 1) {
      const y = -safeBounds + yIndex * step
      for (let xIndex = 0; xIndex < safeResolution; xIndex += 1) {
        const x = -safeBounds + xIndex * step
        const potential = samplePotentialAtPoint(charges, { x, y, z }, softeningEpsilon, softPotentialLimit)

        if (potential < minPotential) {
          minPotential = potential
        }
        if (potential > maxPotential) {
          maxPotential = potential
        }

        samples.push({ x, y, z, potential })
      }
    }
  }

  const isoLevels = computeIsoLevels(shellCount)
  const positiveScale = Math.max(0, maxPotential)
  const negativeScale = Math.min(0, minPotential)
  const tolerance = Math.max(minTolerance, (maxPotential - minPotential) * toleranceRatio)

  const positiveSurfaces = isoLevels
    .map((level) => {
      const isoValue = positiveScale * level
      const points = collectSurfacePoints(samples, isoValue, tolerance, 'positive', maxPointsPerSurface)
      return {
        level,
        isoValue,
        points,
      }
    })
    .filter((surface) => surface.points.length > 0)

  const negativeSurfaces = isoLevels
    .map((level) => {
      const isoValue = negativeScale * level
      const points = collectSurfacePoints(samples, isoValue, tolerance, 'negative', maxPointsPerSurface)
      return {
        level,
        isoValue,
        points,
      }
    })
    .filter((surface) => surface.points.length > 0)

  const positivePointCount = positiveSurfaces.reduce((sum, surface) => sum + surface.points.length, 0)
  const negativePointCount = negativeSurfaces.reduce((sum, surface) => sum + surface.points.length, 0)

  const maxAbs = Math.abs(maxPotential)
  const minAbs = Math.abs(minPotential)
  const dominantPolarity: EquipotentialStats['dominantPolarity'] =
    Math.abs(maxAbs - minAbs) < 0.25
      ? 'balanced'
      : maxAbs > minAbs
        ? 'positive'
        : 'negative'

  return {
    positiveSurfaces,
    negativeSurfaces,
    stats: {
      minPotential,
      maxPotential,
      positivePointCount,
      negativePointCount,
      positiveChargeCount,
      negativeChargeCount,
      dominantPolarity,
    },
  }
}
