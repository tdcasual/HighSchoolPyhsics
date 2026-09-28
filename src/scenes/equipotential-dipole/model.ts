export type DipoleParams = {
  separation: number
  charge: number
  probeX: number
  probeY: number
  flow: boolean
  showEquipotential: boolean
  showVectors: boolean
}

export type DipoleReadings = {
  positiveField: { x: number; y: number }
  negativeField: { x: number; y: number }
  totalField: { x: number; y: number }
  positiveMagnitude: number
  negativeMagnitude: number
  totalMagnitude: number
  potential: number
  distanceToPositive: number
  distanceToNegative: number
}

export type EquipotentialContour = {
  value: number
  polarity: 'positive' | 'negative'
  points: Array<[number, number, number]>
}

const COULOMB_CONSTANT = 9e9
const MICROCOULOMB = 1e-6
const CENTIMETER = 1e-2
const MIN_DISTANCE_CM = 0.25

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function fieldFromCharge(chargeMicroC: number, sourceX: number, sourceY: number, x: number, y: number) {
  const dxCm = x - sourceX
  const dyCm = y - sourceY
  const distanceCm = Math.max(MIN_DISTANCE_CM, Math.hypot(dxCm, dyCm))
  const dxM = dxCm * CENTIMETER
  const dyM = dyCm * CENTIMETER
  const distanceM = distanceCm * CENTIMETER
  const scale = COULOMB_CONSTANT * chargeMicroC * MICROCOULOMB / distanceM ** 3
  return { x: dxM * scale, y: dyM * scale }
}

function fieldAt(x: number, y: number, separation: number, charge: number) {
  const half = Math.max(0.5, separation / 2)
  const positive = fieldFromCharge(charge, -half, 0, x, y)
  const negative = fieldFromCharge(-charge, half, 0, x, y)
  return { x: positive.x + negative.x, y: positive.y + negative.y }
}

export function electricPotentialAt(x: number, y: number, separation: number, charge: number): number {
  const half = Math.max(0.5, separation / 2)
  const distancePositiveM = Math.max(MIN_DISTANCE_CM, Math.hypot(x + half, y)) * CENTIMETER
  const distanceNegativeM = Math.max(MIN_DISTANCE_CM, Math.hypot(x - half, y)) * CENTIMETER
  return COULOMB_CONSTANT * charge * MICROCOULOMB * (1 / distancePositiveM - 1 / distanceNegativeM)
}

export function deriveDipoleReadings(params: DipoleParams): DipoleReadings {
  const half = Math.max(0.5, params.separation / 2)
  const positiveField = fieldFromCharge(params.charge, -half, 0, params.probeX, params.probeY)
  const negativeField = fieldFromCharge(-params.charge, half, 0, params.probeX, params.probeY)
  const totalField = { x: positiveField.x + negativeField.x, y: positiveField.y + negativeField.y }
  const distanceToPositive = Math.max(MIN_DISTANCE_CM, Math.hypot(params.probeX + half, params.probeY))
  const distanceToNegative = Math.max(MIN_DISTANCE_CM, Math.hypot(params.probeX - half, params.probeY))
  return {
    positiveField,
    negativeField,
    totalField,
    positiveMagnitude: Math.hypot(positiveField.x, positiveField.y),
    negativeMagnitude: Math.hypot(negativeField.x, negativeField.y),
    totalMagnitude: Math.hypot(totalField.x, totalField.y),
    potential: electricPotentialAt(params.probeX, params.probeY, params.separation, params.charge),
    distanceToPositive,
    distanceToNegative,
  }
}

type Point2 = [number, number]
type Segment = [Point2, Point2]

function endpointKey(point: Point2): string {
  return Math.round(point[0] * 10000) + ':' + Math.round(point[1] * 10000)
}

function joinSegments(segments: Segment[]): Point2[][] {
  const adjacency = new Map<string, number[]>()
  segments.forEach((segment, index) => {
    for (const point of segment) {
      const key = endpointKey(point)
      const connected = adjacency.get(key) ?? []
      connected.push(index)
      adjacency.set(key, connected)
    }
  })
  const remaining = new Set(segments.map((_, index) => index))
  const lines: Point2[][] = []
  const extend = (points: Point2[], atStart: boolean) => {
    for (let guard = 0; guard < segments.length; guard += 1) {
      const endpoint = atStart ? points[0] : points[points.length - 1]
      const nextIndex = adjacency.get(endpointKey(endpoint))?.find((index) => remaining.has(index))
      if (nextIndex === undefined) return
      remaining.delete(nextIndex)
      const segment = segments[nextIndex]
      const other = endpointKey(segment[0]) === endpointKey(endpoint) ? segment[1] : segment[0]
      if (atStart) points.unshift(other)
      else points.push(other)
      if (endpointKey(points[0]) === endpointKey(points[points.length - 1])) return
    }
  }
  while (remaining.size > 0) {
    const index = remaining.values().next().value as number
    remaining.delete(index)
    const points = [segments[index][0], segments[index][1]]
    extend(points, false)
    extend(points, true)
    if (points.length > 2) lines.push(points)
  }
  return lines
}

export function buildEquipotentialContours(separation: number, charge: number, bounds = 6, steps = 120): EquipotentialContour[] {
  const divisions = Math.max(24, Math.floor(steps))
  const step = bounds * 2 / divisions
  const coordinates = Array.from({ length: divisions + 1 }, (_, index) => -bounds + index * step)
  const potentialGrid = coordinates.map((y) => coordinates.map((x) => electricPotentialAt(x, y, separation, charge)))
  const characteristicPotential = COULOMB_CONSTANT * Math.abs(charge) * MICROCOULOMB / (Math.max(1, separation) * CENTIMETER)
  const fractions = [0.14, 0.27, 0.42, 0.62, 0.88, 1.2]
  const levels = fractions.flatMap((fraction) => [fraction * characteristicPotential, -fraction * characteristicPotential])
  const contours: EquipotentialContour[] = []

  for (const level of levels) {
    const segments: Segment[] = []
    for (let row = 0; row < divisions; row += 1) {
      for (let column = 0; column < divisions; column += 1) {
        const x0 = coordinates[column]
        const x1 = coordinates[column + 1]
        const y0 = coordinates[row]
        const y1 = coordinates[row + 1]
        const corners: Array<[Point2, number]> = [
          [[x0, y0], potentialGrid[row][column]],
          [[x1, y0], potentialGrid[row][column + 1]],
          [[x1, y1], potentialGrid[row + 1][column + 1]],
          [[x0, y1], potentialGrid[row + 1][column]],
        ]
        const crossings: Point2[] = []
        for (let edge = 0; edge < 4; edge += 1) {
          const [pointA, valueA] = corners[edge]
          const [pointB, valueB] = corners[(edge + 1) % 4]
          const deltaA = valueA - level
          const deltaB = valueB - level
          if ((deltaA < 0 && deltaB >= 0) || (deltaB < 0 && deltaA >= 0)) {
            const ratio = deltaA / (deltaA - deltaB)
            crossings.push([pointA[0] + (pointB[0] - pointA[0]) * ratio, pointA[1] + (pointB[1] - pointA[1]) * ratio])
          }
        }
        if (crossings.length === 2) segments.push([crossings[0], crossings[1]])
        else if (crossings.length === 4) {
          segments.push([crossings[0], crossings[1]], [crossings[2], crossings[3]])
        }
      }
    }
    const polylines = joinSegments(segments)
    for (const line of polylines) {
      contours.push({
        value: level,
        polarity: level > 0 ? 'positive' : 'negative',
        points: line.map(([x, y]) => [x, y, 0.035]),
      })
    }
  }

  return contours
}

function unitFieldAt(point: Point2, separation: number, charge: number): Point2 {
  const field = fieldAt(point[0], point[1], separation, charge)
  const magnitude = Math.hypot(field.x, field.y)
  if (magnitude < 1e-12) return [0, 0]
  return [field.x / magnitude, field.y / magnitude]
}

export function buildFieldArcLines(separation: number, count = 18, bounds = 4.8): Array<Array<[number, number, number]>> {
  const half = Math.max(0.5, separation / 2)
  const safeCount = Math.max(6, Math.floor(count))
  const seedRadius = 0.48
  const stepSize = 0.06
  return Array.from({ length: safeCount }, (_, index) => {
    const angle = index / safeCount * Math.PI * 2
    let current: Point2 = [-half + Math.cos(angle) * seedRadius, Math.sin(angle) * seedRadius]
    const points: Array<[number, number, number]> = [[current[0], current[1], 0.075]]
    for (let step = 0; step < 1800; step += 1) {
      const k1 = unitFieldAt(current, separation, 1)
      const p2: Point2 = [current[0] + k1[0] * stepSize / 2, current[1] + k1[1] * stepSize / 2]
      const k2 = unitFieldAt(p2, separation, 1)
      const p3: Point2 = [current[0] + k2[0] * stepSize / 2, current[1] + k2[1] * stepSize / 2]
      const k3 = unitFieldAt(p3, separation, 1)
      const p4: Point2 = [current[0] + k3[0] * stepSize, current[1] + k3[1] * stepSize]
      const k4 = unitFieldAt(p4, separation, 1)
      current = [
        current[0] + stepSize * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6,
        current[1] + stepSize * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6,
      ]
      points.push([current[0], current[1], 0.075])
      if (Math.hypot(current[0] - half, current[1]) < seedRadius || Math.abs(current[0]) > bounds || Math.abs(current[1]) > bounds) break
    }
    return points
  })
}
