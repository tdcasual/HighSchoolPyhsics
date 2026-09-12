export type VerificationStep = 'draw' | 'synthesis' | 'compare'

export type ParallelogramParams = {
  f1: number
  f2: number
  angleDeg: number
  step: VerificationStep
}

export type ParallelogramReadings = {
  f1Vector: { x: number; y: number }
  f2Vector: { x: number; y: number }
  sumVector: { x: number; y: number }
  theoreticalMagnitude: number
  measuredMagnitude: number
  theoreticalAngleDeg: number
  measuredAngleDeg: number
  magnitudeErrorPercent: number
  angleErrorDeg: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function deriveParallelogramReadings(params: ParallelogramParams): ParallelogramReadings {
  const halfAngle = clamp(params.angleDeg, 10, 170) * Math.PI / 360
  const f1Vector = { x: -Math.sin(halfAngle) * params.f1, y: -Math.cos(halfAngle) * params.f1 }
  const f2Vector = { x: Math.sin(halfAngle) * params.f2, y: -Math.cos(halfAngle) * params.f2 }
  const sumVector = { x: f1Vector.x + f2Vector.x, y: f1Vector.y + f2Vector.y }
  const theoreticalMagnitude = Math.hypot(sumVector.x, sumVector.y)
  const theoreticalAngleDeg = Math.atan2(sumVector.x, -sumVector.y) * 180 / Math.PI
  const measuredMagnitude = theoreticalMagnitude * 0.998
  const measuredAngleDeg = theoreticalAngleDeg + 0.5
  return {
    f1Vector,
    f2Vector,
    sumVector,
    theoreticalMagnitude,
    measuredMagnitude,
    theoreticalAngleDeg,
    measuredAngleDeg,
    magnitudeErrorPercent: Math.abs(measuredMagnitude - theoreticalMagnitude) / Math.max(0.001, theoreticalMagnitude) * 100,
    angleErrorDeg: Math.abs(measuredAngleDeg - theoreticalAngleDeg),
  }
}

export function buildForceComparison(params: ParallelogramParams, samples = 41): Array<[number, number, number]> {
  const count = Math.max(3, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const angle = 10 + index / (count - 1) * 160
    const readings = deriveParallelogramReadings({ ...params, angleDeg: angle })
    return [angle, readings.theoreticalMagnitude, readings.measuredMagnitude]
  })
}
