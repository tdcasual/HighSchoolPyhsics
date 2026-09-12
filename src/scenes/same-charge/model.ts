export type SameChargePolarity = 'positive' | 'negative'

export type SameChargeParams = {
  separation: number
  charge: number
  probeX: number
  probeY: number
  polarity: SameChargePolarity
  flow: boolean
  showEquipotential: boolean
  showVectors: boolean
}

export type SameChargeReadings = {
  field1: { x: number; y: number }
  field2: { x: number; y: number }
  totalField: { x: number; y: number }
  field1Magnitude: number
  field2Magnitude: number
  totalMagnitude: number
  potential: number
  distance1: number
  distance2: number
  signedCharge: number
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

export function deriveSameChargeReadings(params: SameChargeParams): SameChargeReadings {
  const half = Math.max(0.5, params.separation / 2)
  const signedCharge = params.polarity === 'positive' ? params.charge : -params.charge
  const field1 = fieldFromCharge(signedCharge, -half, 0, params.probeX, params.probeY)
  const field2 = fieldFromCharge(signedCharge, half, 0, params.probeX, params.probeY)
  const totalField = { x: field1.x + field2.x, y: field1.y + field2.y }
  const distance1 = Math.max(0.25, Math.hypot(params.probeX + half, params.probeY))
  const distance2 = Math.max(0.25, Math.hypot(params.probeX - half, params.probeY))
  return {
    field1,
    field2,
    totalField,
    field1Magnitude: Math.hypot(field1.x, field1.y),
    field2Magnitude: Math.hypot(field2.x, field2.y),
    totalMagnitude: Math.hypot(totalField.x, totalField.y),
    potential: K * signedCharge / distance1 + K * signedCharge / distance2,
    distance1,
    distance2,
    signedCharge,
  }
}

export type SameChargeContour = {
  center: [number, number]
  radiusX: number
  radiusY: number
  rotation?: number
  kind: 'local' | 'outer'
}

export function buildSameChargeContours(separation: number, levels = 6): SameChargeContour[] {
  const half = Math.max(0.5, separation / 2)
  const count = Math.max(3, Math.floor(levels))
  const local = Array.from({ length: count }, (_, index) => {
    const radius = 0.45 + index * 0.42
    return [
      { center: [-half, 0] as [number, number], radiusX: radius, radiusY: radius, kind: 'local' as const },
      { center: [half, 0] as [number, number], radiusX: radius, radiusY: radius, kind: 'local' as const },
    ]
  }).flat()
  const outer = Array.from({ length: Math.max(2, count - 2) }, (_, index) => {
    const radius = 1.8 + index * 0.64
    return { center: [0, 0] as [number, number], radiusX: radius + half * 0.45, radiusY: radius * 0.86, kind: 'outer' as const }
  })
  return [...local, ...outer]
}

export function buildSameChargeFieldLines(separation: number, count = 9): Array<Array<[number, number, number]>> {
  const half = Math.max(0.5, separation / 2)
  const safeCount = Math.max(5, Math.floor(count))
  return [-half, half].flatMap((sourceX, sourceIndex) => Array.from({ length: safeCount }, (_, index) => {
    const angle = (index / safeCount) * Math.PI * 2 + (sourceIndex ? Math.PI / safeCount : 0)
    return Array.from({ length: 28 }, (_, pointIndex) => {
      const t = pointIndex / 27
      const radius = 0.5 + t * 4.25
      const away = Math.sign(sourceX) * Math.sin(Math.PI * t) * 0.58
      const x = sourceX + Math.cos(angle) * radius + away * (1 - Math.abs(Math.cos(angle)))
      const y = Math.sin(angle) * radius + away * Math.cos(angle) * 0.2
      return [x, y, 0.08] as [number, number, number]
    })
  }))
}

export function buildSameChargeTrace(params: SameChargeParams, samples = 41): Array<[number, number, number]> {
  const count = Math.max(3, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const separation = 2 + (index / (count - 1)) * 4
    const readings = deriveSameChargeReadings({ ...params, separation })
    return [separation, readings.totalMagnitude, readings.potential]
  })
}
