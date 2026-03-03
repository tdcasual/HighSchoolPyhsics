export type ElectrostaticCharge = {
  id: string
  x: number
  z: number
  magnitude: number
}

export type PresetKey =
  | 'single'
  | 'dipole'
  | 'same'
  | 'opposite'
  | 'three-linear'
  | 'three-triangle'
  | 'quadrupole'

type Vector2 = {
  x: number
  z: number
}

type PotentialSampleOptions = {
  kScale?: number
  softening?: number
  potentialClamp?: number
}

export type PotentialTerrainStats = {
  minPotential: number
  maxPotential: number
  maxAbsPotential: number
}

export type ContourSegment = {
  level: number
  from: [number, number, number]
  to: [number, number, number]
}

export type PotentialTerrain = {
  vertexPositions: Float32Array
  vertexColors: Float32Array
  indices: Uint32Array
  contourSegments: ContourSegment[]
  stats: PotentialTerrainStats
}

type BuildPotentialTerrainOptions = {
  charges: ReadonlyArray<ElectrostaticCharge>
  bounds: number
  resolution: number
  contourLevels: number[]
  heightScale?: number
  invertHeight?: boolean
  sample?: PotentialSampleOptions
}

type BuildFieldLinesOptions = {
  charges: ReadonlyArray<ElectrostaticCharge>
  bounds: number
  seedsPerCharge?: number
  maxSteps?: number
  stepSize?: number
  captureRadius?: number
  sample?: PotentialSampleOptions
}

type PresetDefinition = {
  label: string
  charges: ElectrostaticCharge[]
}

const DEFAULT_SOFTENING = 0.24
const DEFAULT_POTENTIAL_CLAMP = 6.5
const DEFAULT_K_SCALE = 1

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function samplePotentialAt(
  charges: ReadonlyArray<ElectrostaticCharge>,
  point: Vector2,
  options: PotentialSampleOptions = {},
): number {
  const softening = Math.max(1e-3, options.softening ?? DEFAULT_SOFTENING)
  const potentialClamp = Math.max(1e-2, options.potentialClamp ?? DEFAULT_POTENTIAL_CLAMP)
  const kScale = options.kScale ?? DEFAULT_K_SCALE
  const epsilonSquared = softening * softening
  let potential = 0

  for (const charge of charges) {
    const dx = point.x - charge.x
    const dz = point.z - charge.z
    const r = Math.sqrt(dx * dx + dz * dz + epsilonSquared)
    potential += (kScale * charge.magnitude) / r
  }

  return clamp(potential, -potentialClamp, potentialClamp)
}

export function sampleElectricFieldAt(
  charges: ReadonlyArray<ElectrostaticCharge>,
  point: Vector2,
  options: PotentialSampleOptions = {},
): { ex: number; ez: number; magnitude: number } {
  const softening = Math.max(1e-3, options.softening ?? DEFAULT_SOFTENING)
  const kScale = options.kScale ?? DEFAULT_K_SCALE
  const epsilonSquared = softening * softening
  let ex = 0
  let ez = 0

  for (const charge of charges) {
    const dx = point.x - charge.x
    const dz = point.z - charge.z
    const rSquared = dx * dx + dz * dz + epsilonSquared
    const r = Math.sqrt(rSquared)
    const factor = (kScale * charge.magnitude) / (rSquared * r)
    ex += factor * dx
    ez += factor * dz
  }

  return { ex, ez, magnitude: Math.hypot(ex, ez) }
}

function mapPotentialToColor(potential: number, maxAbsPotential: number): [number, number, number] {
  const safeMax = Math.max(1e-5, maxAbsPotential)
  const t = clamp(Math.abs(potential) / safeMax, 0, 1)
  const neutral: [number, number, number] = [0.79, 0.82, 0.9]
  const positive: [number, number, number] = [0.97, 0.4, 0.35]
  const negative: [number, number, number] = [0.34, 0.58, 1]
  const target = potential >= 0 ? positive : negative

  return [
    neutral[0] + (target[0] - neutral[0]) * t,
    neutral[1] + (target[1] - neutral[1]) * t,
    neutral[2] + (target[2] - neutral[2]) * t,
  ]
}

function interpolateCrossing(
  level: number,
  aPotential: number,
  bPotential: number,
  aX: number,
  aZ: number,
  aY: number,
  bX: number,
  bZ: number,
  bY: number,
): [number, number, number] | null {
  const deltaA = aPotential - level
  const deltaB = bPotential - level
  if (deltaA === 0 && deltaB === 0) {
    return null
  }
  if (deltaA * deltaB > 0) {
    return null
  }
  if (aPotential === bPotential) {
    return null
  }

  const t = (level - aPotential) / (bPotential - aPotential)
  if (!Number.isFinite(t) || t < 0 || t > 1) {
    return null
  }

  return [aX + (bX - aX) * t, aY + (bY - aY) * t + 0.045, aZ + (bZ - aZ) * t]
}

function buildContourSegments(
  potentials: Float32Array,
  bounds: number,
  resolution: number,
  step: number,
  levels: number[],
  heightScale: number,
  invertHeight: boolean,
): ContourSegment[] {
  const segments: ContourSegment[] = []
  const heightDirection = invertHeight ? -1 : 1
  const indexOf = (xIndex: number, zIndex: number) => zIndex * resolution + xIndex

  for (let zIndex = 0; zIndex < resolution - 1; zIndex += 1) {
    const z = -bounds + zIndex * step
    const nextZ = z + step
    for (let xIndex = 0; xIndex < resolution - 1; xIndex += 1) {
      const x = -bounds + xIndex * step
      const nextX = x + step

      const i00 = indexOf(xIndex, zIndex)
      const i10 = indexOf(xIndex + 1, zIndex)
      const i01 = indexOf(xIndex, zIndex + 1)
      const i11 = indexOf(xIndex + 1, zIndex + 1)

      const p00 = potentials[i00]
      const p10 = potentials[i10]
      const p01 = potentials[i01]
      const p11 = potentials[i11]

      const y00 = p00 * heightScale * heightDirection
      const y10 = p10 * heightScale * heightDirection
      const y01 = p01 * heightScale * heightDirection
      const y11 = p11 * heightScale * heightDirection

      for (const level of levels) {
        const candidates = [
          interpolateCrossing(level, p00, p10, x, z, y00, nextX, z, y10),
          interpolateCrossing(level, p10, p11, nextX, z, y10, nextX, nextZ, y11),
          interpolateCrossing(level, p11, p01, nextX, nextZ, y11, x, nextZ, y01),
          interpolateCrossing(level, p01, p00, x, nextZ, y01, x, z, y00),
        ].filter((point): point is [number, number, number] => point !== null)

        if (candidates.length === 2) {
          segments.push({ level, from: candidates[0], to: candidates[1] })
          continue
        }

        if (candidates.length === 4) {
          segments.push({ level, from: candidates[0], to: candidates[1] })
          segments.push({ level, from: candidates[2], to: candidates[3] })
        }
      }
    }
  }

  return segments
}

export function buildPotentialTerrain(options: BuildPotentialTerrainOptions): PotentialTerrain {
  const {
    charges,
    bounds,
    resolution,
    contourLevels,
    heightScale = 0.62,
    invertHeight = false,
    sample = {},
  } = options
  const safeBounds = Math.max(1, bounds)
  const safeResolution = Math.max(12, Math.min(56, Math.round(resolution)))
  const vertexCount = safeResolution * safeResolution
  const vertexPositions = new Float32Array(vertexCount * 3)
  const vertexColors = new Float32Array(vertexCount * 3)
  const potentials = new Float32Array(vertexCount)
  const step = (safeBounds * 2) / (safeResolution - 1)
  const heightDirection = invertHeight ? -1 : 1

  let minPotential = Number.POSITIVE_INFINITY
  let maxPotential = Number.NEGATIVE_INFINITY

  for (let zIndex = 0; zIndex < safeResolution; zIndex += 1) {
    const z = -safeBounds + zIndex * step
    for (let xIndex = 0; xIndex < safeResolution; xIndex += 1) {
      const x = -safeBounds + xIndex * step
      const index = zIndex * safeResolution + xIndex
      const potential = samplePotentialAt(charges, { x, z }, sample)
      potentials[index] = potential
      minPotential = Math.min(minPotential, potential)
      maxPotential = Math.max(maxPotential, potential)
    }
  }

  if (!Number.isFinite(minPotential)) {
    minPotential = 0
  }
  if (!Number.isFinite(maxPotential)) {
    maxPotential = 0
  }

  const maxAbsPotential = Math.max(Math.abs(minPotential), Math.abs(maxPotential))
  for (let zIndex = 0; zIndex < safeResolution; zIndex += 1) {
    const z = -safeBounds + zIndex * step
    for (let xIndex = 0; xIndex < safeResolution; xIndex += 1) {
      const x = -safeBounds + xIndex * step
      const index = zIndex * safeResolution + xIndex
      const positionOffset = index * 3
      const colorOffset = index * 3
      const potential = potentials[index]
      const y = potential * heightScale * heightDirection
      const [r, g, b] = mapPotentialToColor(potential, maxAbsPotential)

      vertexPositions[positionOffset] = x
      vertexPositions[positionOffset + 1] = y
      vertexPositions[positionOffset + 2] = z

      vertexColors[colorOffset] = r
      vertexColors[colorOffset + 1] = g
      vertexColors[colorOffset + 2] = b
    }
  }

  const indexBuffer: number[] = []
  for (let zIndex = 0; zIndex < safeResolution - 1; zIndex += 1) {
    for (let xIndex = 0; xIndex < safeResolution - 1; xIndex += 1) {
      const topLeft = zIndex * safeResolution + xIndex
      const topRight = topLeft + 1
      const bottomLeft = topLeft + safeResolution
      const bottomRight = bottomLeft + 1
      indexBuffer.push(topLeft, bottomLeft, topRight)
      indexBuffer.push(topRight, bottomLeft, bottomRight)
    }
  }

  const contourSegments = buildContourSegments(
    potentials,
    safeBounds,
    safeResolution,
    step,
    contourLevels,
    heightScale,
    invertHeight,
  )

  return {
    vertexPositions,
    vertexColors,
    indices: Uint32Array.from(indexBuffer),
    contourSegments,
    stats: {
      minPotential,
      maxPotential,
      maxAbsPotential,
    },
  }
}

function createCellKey(point: Vector2, size: number): string {
  return `${Math.round(point.x / size)}:${Math.round(point.z / size)}`
}

export function buildFieldLines(options: BuildFieldLinesOptions): Array<Array<[number, number, number]>> {
  const {
    charges,
    bounds,
    seedsPerCharge = 10,
    maxSteps = 210,
    stepSize = 0.2,
    captureRadius = 0.42,
    sample = {},
  } = options

  if (charges.length === 0) {
    return []
  }

  const seedCharges = charges.some((charge) => charge.magnitude > 0)
    ? charges.filter((charge) => charge.magnitude > 0)
    : charges

  const lines: Array<Array<[number, number, number]>> = []
  const hardBounds = Math.max(1, bounds)
  const loopCellSize = 0.2

  for (const seedCharge of seedCharges) {
    const direction = seedCharge.magnitude >= 0 ? 1 : -1
    const targetSign = seedCharge.magnitude >= 0 ? -1 : 1
    const lineCount = Math.max(
      6,
      Math.round(seedsPerCharge * Math.max(0.75, Math.sqrt(Math.abs(seedCharge.magnitude)) * 0.6)),
    )

    for (let seedIndex = 0; seedIndex < lineCount; seedIndex += 1) {
      const angle = (seedIndex / lineCount) * Math.PI * 2
      const radius = 0.34
      let current: Vector2 = {
        x: seedCharge.x + Math.cos(angle) * radius,
        z: seedCharge.z + Math.sin(angle) * radius,
      }

      const line: Array<[number, number, number]> = [[current.x, 0.08, current.z]]
      const visitedCells = new Set<string>([createCellKey(current, loopCellSize)])

      for (let step = 0; step < maxSteps; step += 1) {
        const field = sampleElectricFieldAt(charges, current, sample)
        if (field.magnitude < 1e-5) {
          break
        }

        const nx = field.ex / field.magnitude
        const nz = field.ez / field.magnitude
        const next: Vector2 = {
          x: current.x + nx * stepSize * direction,
          z: current.z + nz * stepSize * direction,
        }
        line.push([next.x, 0.08, next.z])

        if (Math.abs(next.x) > hardBounds || Math.abs(next.z) > hardBounds) {
          break
        }

        const nextCell = createCellKey(next, loopCellSize)
        if (visitedCells.has(nextCell)) {
          break
        }
        visitedCells.add(nextCell)

        let captured = false
        for (const charge of charges) {
          if (Math.sign(charge.magnitude) !== targetSign) {
            continue
          }
          const dx = next.x - charge.x
          const dz = next.z - charge.z
          if (Math.hypot(dx, dz) <= captureRadius) {
            captured = true
            break
          }
        }

        current = next
        if (captured) {
          break
        }
      }

      if (line.length > 8) {
        lines.push(line)
      }
    }
  }

  return lines
}

export function summarizeChargeSet(charges: ReadonlyArray<ElectrostaticCharge>): {
  positiveCount: number
  negativeCount: number
  netCharge: number
} {
  let positiveCount = 0
  let negativeCount = 0
  let netCharge = 0

  for (const charge of charges) {
    if (charge.magnitude > 0) {
      positiveCount += 1
    } else if (charge.magnitude < 0) {
      negativeCount += 1
    }
    netCharge += charge.magnitude
  }

  return { positiveCount, negativeCount, netCharge }
}

export const PRESET_CONFIGS: Record<PresetKey, PresetDefinition> = {
  single: {
    label: '单点电荷',
    charges: [{ id: 'C1', x: 0, z: 0, magnitude: 3.2 }],
  },
  dipole: {
    label: '电偶极子',
    charges: [
      { id: 'C1', x: -2.4, z: 0, magnitude: 3.2 },
      { id: 'C2', x: 2.4, z: 0, magnitude: -3.2 },
    ],
  },
  same: {
    label: '等量同号',
    charges: [
      { id: 'C1', x: -2.3, z: 0, magnitude: 2.8 },
      { id: 'C2', x: 2.3, z: 0, magnitude: 2.8 },
    ],
  },
  opposite: {
    label: '等量异号',
    charges: [
      { id: 'C1', x: -3, z: 0, magnitude: 2.8 },
      { id: 'C2', x: 3, z: 0, magnitude: -2.8 },
    ],
  },
  'three-linear': {
    label: '三电荷线性',
    charges: [
      { id: 'C1', x: -3.6, z: 0, magnitude: 2.2 },
      { id: 'C2', x: 0, z: 0, magnitude: -1.3 },
      { id: 'C3', x: 3.6, z: 0, magnitude: 2.2 },
    ],
  },
  'three-triangle': {
    label: '三电荷三角',
    charges: [
      { id: 'C1', x: 0, z: 2.8, magnitude: 2.1 },
      { id: 'C2', x: -2.4, z: -1.4, magnitude: 2.1 },
      { id: 'C3', x: 2.4, z: -1.4, magnitude: 2.1 },
    ],
  },
  quadrupole: {
    label: '电四极子',
    charges: [
      { id: 'C1', x: -2.2, z: -2.2, magnitude: 2.2 },
      { id: 'C2', x: 2.2, z: -2.2, magnitude: -2.2 },
      { id: 'C3', x: -2.2, z: 2.2, magnitude: -2.2 },
      { id: 'C4', x: 2.2, z: 2.2, magnitude: 2.2 },
    ],
  },
}

export function clonePresetCharges(preset: PresetKey): ElectrostaticCharge[] {
  return PRESET_CONFIGS[preset].charges.map((charge) => ({ ...charge }))
}
