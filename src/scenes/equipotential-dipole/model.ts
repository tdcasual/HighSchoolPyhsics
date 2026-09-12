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

const K = 9

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function fieldFromCharge(charge: number, sourceX: number, sourceY: number, x: number, y: number) {
  const dx = x - sourceX
  const dy = y - sourceY
  const distance = Math.max(0.25, Math.hypot(dx, dy))
  const scale = K * charge / distance ** 3
  return { x: dx * scale, y: dy * scale }
}

export function deriveDipoleReadings(params: DipoleParams): DipoleReadings {
  const half = Math.max(0.5, params.separation / 2)
  const positiveField = fieldFromCharge(params.charge, -half, 0, params.probeX, params.probeY)
  const negativeField = fieldFromCharge(-params.charge, half, 0, params.probeX, params.probeY)
  const totalField = { x: positiveField.x + negativeField.x, y: positiveField.y + negativeField.y }
  const distanceToPositive = Math.max(0.25, Math.hypot(params.probeX + half, params.probeY))
  const distanceToNegative = Math.max(0.25, Math.hypot(params.probeX - half, params.probeY))
  return {
    positiveField,
    negativeField,
    totalField,
    positiveMagnitude: Math.hypot(positiveField.x, positiveField.y),
    negativeMagnitude: Math.hypot(negativeField.x, negativeField.y),
    totalMagnitude: Math.hypot(totalField.x, totalField.y),
    potential: K * params.charge / distanceToPositive - K * params.charge / distanceToNegative,
    distanceToPositive,
    distanceToNegative,
  }
}

export function buildContourRings(separation: number, levels = 6): Array<{ center: [number, number]; radius: number; polarity: 'positive' | 'negative' }> {
  const half = Math.max(0.5, separation / 2)
  const count = Math.max(2, Math.floor(levels))
  return Array.from({ length: count }, (_, index) => {
    const radius = 0.45 + index * 0.42
    return [
      { center: [-half, 0] as [number, number], radius, polarity: 'positive' as const },
      { center: [half, 0] as [number, number], radius, polarity: 'negative' as const },
    ]
  }).flat()
}

export function buildFieldArcLines(separation: number, count = 9): Array<Array<[number, number, number]>> {
  const half = Math.max(0.5, separation / 2)
  const safeCount = Math.max(3, Math.floor(count))
  return Array.from({ length: safeCount }, (_, index) => {
    const lift = (index - (safeCount - 1) / 2) * 0.34
    return Array.from({ length: 25 }, (_, pointIndex) => {
      const t = pointIndex / 24
      const x = -half + separation * t
      const y = lift * Math.sin(Math.PI * t) + lift * 0.14
      return [x, y, 0.08] as [number, number, number]
    })
  })
}
