import { sampleElectricField2D } from '../../domains/electrostatics/field'
import { cloneElectrostaticPresetCharges, ELECTROSTATIC_LAB_PRESET_CONFIGS } from '../../domains/electrostatics/presets'
import { samplePotential2D } from '../../domains/electrostatics/potential'
import { summarizeChargeMagnitudes } from '../../domains/electrostatics/charges'
import type {
  ElectrostaticCharge2D,
  ElectrostaticPresetDefinition,
  ElectrostaticPresetKey,
  PotentialSampleOptions,
  Vector2,
} from '../../domains/electrostatics/types'

export type ElectrostaticCharge = ElectrostaticCharge2D
export type PresetKey = ElectrostaticPresetKey

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export const ELECTROSTATIC_LAB_SOFTENING = 0.24
export const POTENTIAL_VISUAL_LIMIT = 6.5
export const POTENTIAL_TERRAIN_HEIGHT_SCALE = 0.62

export function samplePotentialAt(
  charges: ReadonlyArray<ElectrostaticCharge>,
  point: Vector2,
  options: PotentialSampleOptions = {},
): number {
  return samplePotential2D(charges, point, {
    softening: ELECTROSTATIC_LAB_SOFTENING,
    potentialClamp: Number.POSITIVE_INFINITY,
    ...options,
  })
}

export function sampleElectricFieldAt(
  charges: ReadonlyArray<ElectrostaticCharge>,
  point: Vector2,
  options: PotentialSampleOptions = {},
): { ex: number; ez: number; magnitude: number } {
  return sampleElectricField2D(charges, point, {
    softening: ELECTROSTATIC_LAB_SOFTENING,
    ...options,
  })
}

export function mapPotentialToTerrainHeight(
  potential: number,
  heightScale = POTENTIAL_TERRAIN_HEIGHT_SCALE,
  invertHeight = false,
): number {
  const direction = invertHeight ? -1 : 1
  return direction * heightScale * POTENTIAL_VISUAL_LIMIT * Math.tanh(potential / POTENTIAL_VISUAL_LIMIT)
}

function mapPotentialToColor(potential: number): [number, number, number] {
  const t = clamp(Math.abs(potential) / POTENTIAL_VISUAL_LIMIT, 0, 1)
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
  if (deltaA * deltaB > 0 || aPotential === bPotential) {
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
  const segmentKeys = new Set<string>()
  const addSegment = (level: number, from: [number, number, number], to: [number, number, number]) => {
    if (Math.hypot(to[0] - from[0], to[2] - from[2]) < 1e-7) {
      return
    }
    const pointKey = (point: [number, number, number]) =>
      [point[0], point[1], point[2]].map((value) => value.toFixed(6)).join(',')
    const endpoints = [pointKey(from), pointKey(to)].sort()
    const key = level.toPrecision(10) + ':' + endpoints[0] + ':' + endpoints[1]
    if (segmentKeys.has(key)) {
      return
    }
    segmentKeys.add(key)
    segments.push({ level, from, to })
  }
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

      const y00 = mapPotentialToTerrainHeight(p00, heightScale, invertHeight)
      const y10 = mapPotentialToTerrainHeight(p10, heightScale, invertHeight)
      const y01 = mapPotentialToTerrainHeight(p01, heightScale, invertHeight)
      const y11 = mapPotentialToTerrainHeight(p11, heightScale, invertHeight)

      for (const level of levels) {
        const edgeIntersections = [
          interpolateCrossing(level, p00, p10, x, z, y00, nextX, z, y10),
          interpolateCrossing(level, p10, p11, nextX, z, y10, nextX, nextZ, y11),
          interpolateCrossing(level, p11, p01, nextX, nextZ, y11, x, nextZ, y01),
          interpolateCrossing(level, p01, p00, x, nextZ, y01, x, z, y00),
        ].filter((point): point is [number, number, number] => point !== null)
        const candidates = edgeIntersections.filter(
          (point, index) =>
            edgeIntersections.findIndex(
              (candidate) => Math.hypot(candidate[0] - point[0], candidate[2] - point[2]) < 1e-7,
            ) === index,
        )

        if (candidates.length === 2) {
          addSegment(level, candidates[0], candidates[1])
          continue
        }

        if (candidates.length === 4) {
          const centerPotential = (p00 + p10 + p11 + p01) / 4
          const centerMatchesP00 = (centerPotential >= level) === (p00 >= level)
          const pairs: ReadonlyArray<readonly [number, number]> = centerMatchesP00
            ? [[0, 1], [2, 3]]
            : [[0, 3], [1, 2]]
          for (const [fromIndex, toIndex] of pairs) {
            addSegment(level, candidates[fromIndex], candidates[toIndex])
          }
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
  const safeResolution = Math.max(12, Math.min(100, Math.round(resolution)))
  const vertexCount = safeResolution * safeResolution
  const vertexPositions = new Float32Array(vertexCount * 3)
  const vertexColors = new Float32Array(vertexCount * 3)
  const potentials = new Float32Array(vertexCount)
  const step = (safeBounds * 2) / (safeResolution - 1)
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
      const y = mapPotentialToTerrainHeight(potential, heightScale, invertHeight)
      const [r, g, b] = mapPotentialToColor(potential)

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

export function samplePotentialTerrainHeight(
  terrain: PotentialTerrain,
  bounds: number,
  point: Vector2,
): number {
  const resolution = Math.round(Math.sqrt(terrain.vertexPositions.length / 3))
  if (resolution < 2) {
    return 0
  }

  const safeBounds = Math.max(1, bounds)
  const step = (safeBounds * 2) / (resolution - 1)
  const gridX = clamp((point.x + safeBounds) / step, 0, resolution - 1)
  const gridZ = clamp((point.z + safeBounds) / step, 0, resolution - 1)
  const xIndex = Math.min(resolution - 2, Math.floor(gridX))
  const zIndex = Math.min(resolution - 2, Math.floor(gridZ))
  const u = gridX - xIndex
  const v = gridZ - zIndex
  const yAt = (x: number, z: number) => terrain.vertexPositions[(z * resolution + x) * 3 + 1]
  const y00 = yAt(xIndex, zIndex)
  const y10 = yAt(xIndex + 1, zIndex)
  const y01 = yAt(xIndex, zIndex + 1)
  const y11 = yAt(xIndex + 1, zIndex + 1)

  if (u + v <= 1) {
    return y00 * (1 - u - v) + y10 * u + y01 * v
  }
  return y10 * (1 - v) + y01 * (1 - u) + y11 * (u + v - 1)
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

  const positiveCharges = charges.filter((charge) => charge.magnitude > 1e-6)
  const negativeCharges = charges.filter((charge) => charge.magnitude < -1e-6)
  const seedCharges = positiveCharges.length > 0 ? positiveCharges : negativeCharges

  const lines: Array<Array<[number, number, number]>> = []
  const hardBounds = Math.max(1, bounds)
  const safeStepSize = Math.max(0.02, Math.abs(stepSize))
  const loopCellSize = Math.max(0.01, Math.min(0.1, safeStepSize * 0.35))

  if (seedCharges.length === 0) {
    return lines
  }

  for (const seedCharge of seedCharges) {
    const direction = seedCharge.magnitude > 0 ? 1 : -1
    const targetSign = seedCharge.magnitude > 0 ? -1 : 1
    const lineCount = Math.max(
      6,
      Math.round(seedsPerCharge * Math.max(0.75, Math.sqrt(Math.abs(seedCharge.magnitude)) * 0.6)),
    )

    for (let seedIndex = 0; seedIndex < lineCount; seedIndex += 1) {
      const angle = (seedIndex / lineCount) * Math.PI * 2
      const radius = 0.44
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
          x: current.x + nx * safeStepSize * direction,
          z: current.z + nz * safeStepSize * direction,
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
  return summarizeChargeMagnitudes(charges)
}

export const PRESET_CONFIGS: Record<PresetKey, ElectrostaticPresetDefinition> =
  ELECTROSTATIC_LAB_PRESET_CONFIGS

export function clonePresetCharges(preset: PresetKey): ElectrostaticCharge[] {
  return cloneElectrostaticPresetCharges(preset, PRESET_CONFIGS)
}
