import { samplePotential3D } from '../../domains/electrostatics/potential'
import type { ElectrostaticCharge3D } from '../../domains/electrostatics/types'

export type EquipotentialCharge = ElectrostaticCharge3D

export type EquipotentialSurface = {
  level: number
  isoValue: number
  positions: Float32Array
  indices: Uint32Array
  triangleCount: number
}

export type EquipotentialStats = {
  minPotential: number
  maxPotential: number
  positiveSurfaceCount: number
  negativeSurfaceCount: number
  positiveTriangleCount: number
  negativeTriangleCount: number
  positiveChargeCount: number
  negativeChargeCount: number
}

export type EquipotentialSurfaceResult = {
  positiveSurfaces: EquipotentialSurface[]
  negativeSurfaces: EquipotentialSurface[]
  stats: EquipotentialStats
}

export type BuildEquipotentialSurfacesOptions = {
  charges: ReadonlyArray<EquipotentialCharge>
  bounds: number
  resolution: number
  shellCount: number
  softeningEpsilon: number
}

type Polarity = 'positive' | 'negative'
type Point3 = [number, number, number]

const CUBE_CORNERS = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
  [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
] as const

// A consistent six-tetrahedron split around each cube's 0→7 diagonal.
const TETRAHEDRA = [
  [0, 5, 1, 7], [0, 1, 3, 7], [0, 3, 2, 7],
  [0, 2, 6, 7], [0, 6, 4, 7], [0, 4, 5, 7],
] as const

function computeIsoLevels(shellCount: number): number[] {
  const safeCount = Number.isFinite(shellCount) ? Math.max(1, Math.min(8, Math.round(shellCount))) : 4
  const gamma = 1.22
  return Array.from({ length: safeCount }, (_, index) => Math.pow((index + 1) / (safeCount + 1), gamma))
}

function clampResolution(resolution: number): number {
  return Number.isFinite(resolution) ? Math.max(10, Math.min(32, Math.round(resolution))) : 20
}

type DomainPotentialExtrema = {
  positiveBoundaryMax: number
  positiveInteriorMax: number
  negativeBoundaryMin: number
  negativeInteriorMin: number
}

function findDomainPotentialExtrema(values: Float32Array, resolution: number): DomainPotentialExtrema {
  let positiveBoundaryMax = Number.NEGATIVE_INFINITY
  let positiveInteriorMax = Number.NEGATIVE_INFINITY
  let negativeBoundaryMin = Number.POSITIVE_INFINITY
  let negativeInteriorMin = Number.POSITIVE_INFINITY

  for (let z = 0; z < resolution; z += 1) {
    for (let y = 0; y < resolution; y += 1) {
      for (let x = 0; x < resolution; x += 1) {
        const value = values[gridIndex(x, y, z, resolution)] ?? 0
        const isBoundary = x === 0 || y === 0 || z === 0 || x === resolution - 1 || y === resolution - 1 || z === resolution - 1
        if (isBoundary) {
          positiveBoundaryMax = Math.max(positiveBoundaryMax, value)
          negativeBoundaryMin = Math.min(negativeBoundaryMin, value)
        } else {
          positiveInteriorMax = Math.max(positiveInteriorMax, value)
          negativeInteriorMin = Math.min(negativeInteriorMin, value)
        }
      }
    }
  }

  return { positiveBoundaryMax, positiveInteriorMax, negativeBoundaryMin, negativeInteriorMin }
}

function interpolateIsoLevels(boundaryValue: number, interiorValue: number, levels: ReadonlyArray<number>): number[] {
  const range = interiorValue - boundaryValue
  if (!Number.isFinite(range) || Math.abs(range) <= 1e-6) return []
  return levels.map((level) => boundaryValue + range * level)
}

function gridIndex(x: number, y: number, z: number, resolution: number): number {
  return (z * resolution + y) * resolution + x
}

function interpolateEdge(
  a: number,
  b: number,
  isoValue: number,
  values: Float32Array,
  gridPositions: Float32Array,
): Point3 {
  const valueA = values[a] ?? isoValue
  const valueB = values[b] ?? isoValue
  const denominator = valueB - valueA
  const t = Math.abs(denominator) < 1e-12
    ? 0.5
    : Math.max(0, Math.min(1, (isoValue - valueA) / denominator))
  const offsetA = a * 3
  const offsetB = b * 3
  return [
    (gridPositions[offsetA] ?? 0) + ((gridPositions[offsetB] ?? 0) - (gridPositions[offsetA] ?? 0)) * t,
    (gridPositions[offsetA + 1] ?? 0) + ((gridPositions[offsetB + 1] ?? 0) - (gridPositions[offsetA + 1] ?? 0)) * t,
    (gridPositions[offsetA + 2] ?? 0) + ((gridPositions[offsetB + 2] ?? 0) - (gridPositions[offsetA + 2] ?? 0)) * t,
  ]
}

function centroid(indices: ReadonlyArray<number>, gridPositions: Float32Array): Point3 {
  const sum: Point3 = [0, 0, 0]
  for (const index of indices) {
    const offset = index * 3
    sum[0] += gridPositions[offset] ?? 0
    sum[1] += gridPositions[offset + 1] ?? 0
    sum[2] += gridPositions[offset + 2] ?? 0
  }
  const count = Math.max(1, indices.length)
  return [sum[0] / count, sum[1] / count, sum[2] / count]
}

function vertexKey(point: Point3): string {
  return `${Math.round(point[0] * 1e5)}:${Math.round(point[1] * 1e5)}:${Math.round(point[2] * 1e5)}`
}

function addIndexedVertex(
  point: Point3,
  positions: number[],
  vertexLookup: Map<string, number>,
): number {
  const key = vertexKey(point)
  const existing = vertexLookup.get(key)
  if (existing !== undefined) return existing
  const index = positions.length / 3
  positions.push(point[0], point[1], point[2])
  vertexLookup.set(key, index)
  return index
}

function appendOrientedTriangle(
  triangle: [Point3, Point3, Point3],
  insideCenter: Point3,
  outsideCenter: Point3,
  positions: number[],
  indices: number[],
  vertexLookup: Map<string, number>,
): void {
  const [a, b, c] = triangle
  const abx = b[0] - a[0]
  const aby = b[1] - a[1]
  const abz = b[2] - a[2]
  const acx = c[0] - a[0]
  const acy = c[1] - a[1]
  const acz = c[2] - a[2]
  const normalX = aby * acz - abz * acy
  const normalY = abz * acx - abx * acz
  const normalZ = abx * acy - aby * acx
  const outwardX = outsideCenter[0] - insideCenter[0]
  const outwardY = outsideCenter[1] - insideCenter[1]
  const outwardZ = outsideCenter[2] - insideCenter[2]
  const reverse = normalX * outwardX + normalY * outwardY + normalZ * outwardZ < 0
  const first = addIndexedVertex(a, positions, vertexLookup)
  const second = addIndexedVertex(reverse ? c : b, positions, vertexLookup)
  const third = addIndexedVertex(reverse ? b : c, positions, vertexLookup)
  if (first !== second && second !== third && first !== third) indices.push(first, second, third)
}

function collectIsoSurface(
  values: Float32Array,
  gridPositions: Float32Array,
  resolution: number,
  isoValue: number,
  polarity: Polarity,
): Pick<EquipotentialSurface, 'positions' | 'indices' | 'triangleCount'> {
  const positions: number[] = []
  const indices: number[] = []
  const vertexLookup = new Map<string, number>()
  const cubeIndices = new Int32Array(8)
  const insideIndices: number[] = []
  const outsideIndices: number[] = []
  const isInside = polarity === 'positive'
    ? (value: number) => value >= isoValue
    : (value: number) => value <= isoValue

  for (let z = 0; z < resolution - 1; z += 1) {
    for (let y = 0; y < resolution - 1; y += 1) {
      for (let x = 0; x < resolution - 1; x += 1) {
        for (let corner = 0; corner < CUBE_CORNERS.length; corner += 1) {
          const offset = CUBE_CORNERS[corner]
          cubeIndices[corner] = gridIndex(x + offset[0], y + offset[1], z + offset[2], resolution)
        }

        for (const tetrahedron of TETRAHEDRA) {
          insideIndices.length = 0
          outsideIndices.length = 0
          for (const corner of tetrahedron) {
            const sampleIndex = cubeIndices[corner] ?? 0
            if (isInside(values[sampleIndex] ?? 0)) insideIndices.push(sampleIndex)
            else outsideIndices.push(sampleIndex)
          }
          if (insideIndices.length === 0 || outsideIndices.length === 0) continue

          const insideCenter = centroid(insideIndices, gridPositions)
          const outsideCenter = centroid(outsideIndices, gridPositions)
          if (insideIndices.length === 1) {
            const a = insideIndices[0] ?? 0
            const triangle: [Point3, Point3, Point3] = [
              interpolateEdge(a, outsideIndices[0] ?? 0, isoValue, values, gridPositions),
              interpolateEdge(a, outsideIndices[1] ?? 0, isoValue, values, gridPositions),
              interpolateEdge(a, outsideIndices[2] ?? 0, isoValue, values, gridPositions),
            ]
            appendOrientedTriangle(triangle, insideCenter, outsideCenter, positions, indices, vertexLookup)
          } else if (outsideIndices.length === 1) {
            const outside = outsideIndices[0] ?? 0
            const triangle: [Point3, Point3, Point3] = [
              interpolateEdge(outside, insideIndices[0] ?? 0, isoValue, values, gridPositions),
              interpolateEdge(outside, insideIndices[1] ?? 0, isoValue, values, gridPositions),
              interpolateEdge(outside, insideIndices[2] ?? 0, isoValue, values, gridPositions),
            ]
            appendOrientedTriangle(triangle, insideCenter, outsideCenter, positions, indices, vertexLookup)
          } else {
            const insideA = insideIndices[0] ?? 0
            const insideB = insideIndices[1] ?? 0
            const outsideA = outsideIndices[0] ?? 0
            const outsideB = outsideIndices[1] ?? 0
            const a = interpolateEdge(insideA, outsideA, isoValue, values, gridPositions)
            const b = interpolateEdge(insideA, outsideB, isoValue, values, gridPositions)
            const c = interpolateEdge(insideB, outsideA, isoValue, values, gridPositions)
            const d = interpolateEdge(insideB, outsideB, isoValue, values, gridPositions)
            appendOrientedTriangle([a, b, d], insideCenter, outsideCenter, positions, indices, vertexLookup)
            appendOrientedTriangle([a, d, c], insideCenter, outsideCenter, positions, indices, vertexLookup)
          }
        }
      }
    }
  }

  const positionArray = Float32Array.from(positions)
  const indexArray = Uint32Array.from(indices)
  return {
    positions: positionArray,
    indices: indexArray,
    triangleCount: Math.floor(indexArray.length / 3),
  }
}

export function samplePotentialAtPoint(
  charges: ReadonlyArray<EquipotentialCharge>,
  point: { x: number; y: number; z: number },
  softeningEpsilon: number,
): number {
  const safeSoftening = Number.isFinite(softeningEpsilon) ? Math.max(1e-3, Math.abs(softeningEpsilon)) : 0.18
  return samplePotential3D(charges, point, { softening: safeSoftening })
}

export function buildEquipotentialSurfaces(options: BuildEquipotentialSurfacesOptions): EquipotentialSurfaceResult {
  const validCharges = options.charges.filter((charge) =>
    Number.isFinite(charge.x) && Number.isFinite(charge.y) && Number.isFinite(charge.z) && Number.isFinite(charge.magnitude),
  )
  const positiveChargeCount = validCharges.filter((charge) => charge.magnitude > 0).length
  const negativeChargeCount = validCharges.filter((charge) => charge.magnitude < 0).length
  const emptyStats: EquipotentialStats = {
    minPotential: 0,
    maxPotential: 0,
    positiveSurfaceCount: 0,
    negativeSurfaceCount: 0,
    positiveTriangleCount: 0,
    negativeTriangleCount: 0,
    positiveChargeCount,
    negativeChargeCount,
  }

  if (validCharges.length === 0 || validCharges.every((charge) => charge.magnitude === 0)) {
    return { positiveSurfaces: [], negativeSurfaces: [], stats: emptyStats }
  }

  const resolution = clampResolution(options.resolution)
  const bounds = Number.isFinite(options.bounds) ? Math.max(1, Math.abs(options.bounds)) : 5
  const softeningEpsilon = Number.isFinite(options.softeningEpsilon)
    ? Math.max(1e-3, Math.abs(options.softeningEpsilon))
    : 0.18
  const step = (bounds * 2) / (resolution - 1)
  const sampleCount = resolution ** 3
  const values = new Float32Array(sampleCount)
  const gridPositions = new Float32Array(sampleCount * 3)
  let minPotential = Number.POSITIVE_INFINITY
  let maxPotential = Number.NEGATIVE_INFINITY

  for (let zIndex = 0; zIndex < resolution; zIndex += 1) {
    const z = -bounds + zIndex * step
    for (let yIndex = 0; yIndex < resolution; yIndex += 1) {
      const y = -bounds + yIndex * step
      for (let xIndex = 0; xIndex < resolution; xIndex += 1) {
        const x = -bounds + xIndex * step
        const index = gridIndex(xIndex, yIndex, zIndex, resolution)
        const potential = samplePotentialAtPoint(validCharges, { x, y, z }, softeningEpsilon)
        values[index] = potential
        const positionOffset = index * 3
        gridPositions[positionOffset] = x
        gridPositions[positionOffset + 1] = y
        gridPositions[positionOffset + 2] = z
        minPotential = Math.min(minPotential, potential)
        maxPotential = Math.max(maxPotential, potential)
      }
    }
  }

  const domainExtrema = findDomainPotentialExtrema(values, resolution)
  const positiveSurfaces: EquipotentialSurface[] = []
  const negativeSurfaces: EquipotentialSurface[] = []
  const levels = computeIsoLevels(options.shellCount)
  const positiveBoundaryValue = Math.max(0, domainExtrema.positiveBoundaryMax)
  const negativeBoundaryValue = Math.min(0, domainExtrema.negativeBoundaryMin)
  const positiveIsoValues = domainExtrema.positiveInteriorMax > positiveBoundaryValue + 1e-6
    ? interpolateIsoLevels(positiveBoundaryValue, domainExtrema.positiveInteriorMax, levels)
    : []
  const negativeIsoValues = domainExtrema.negativeInteriorMin < negativeBoundaryValue - 1e-6
    ? interpolateIsoLevels(negativeBoundaryValue, domainExtrema.negativeInteriorMin, levels)
    : []

  positiveIsoValues.forEach((isoValue, index) => {
    const level = levels[index] ?? 0
    const surface = collectIsoSurface(values, gridPositions, resolution, isoValue, 'positive')
    if (surface.triangleCount > 0) positiveSurfaces.push({ level, isoValue, ...surface })
  })
  negativeIsoValues.forEach((isoValue, index) => {
    const level = levels[index] ?? 0
    const surface = collectIsoSurface(values, gridPositions, resolution, isoValue, 'negative')
    if (surface.triangleCount > 0) negativeSurfaces.push({ level, isoValue, ...surface })
  })

  const positiveTriangleCount = positiveSurfaces.reduce((sum, surface) => sum + surface.triangleCount, 0)
  const negativeTriangleCount = negativeSurfaces.reduce((sum, surface) => sum + surface.triangleCount, 0)
  return {
    positiveSurfaces,
    negativeSurfaces,
    stats: {
      minPotential: Number.isFinite(minPotential) ? minPotential : 0,
      maxPotential: Number.isFinite(maxPotential) ? maxPotential : 0,
      positiveSurfaceCount: positiveSurfaces.length,
      negativeSurfaceCount: negativeSurfaces.length,
      positiveTriangleCount,
      negativeTriangleCount,
      positiveChargeCount,
      negativeChargeCount,
    },
  }
}
