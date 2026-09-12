export type ForceMode = 'synthesis' | 'range' | 'orthogonal' | 'effect'
export type SynthesisRule = 'parallelogram' | 'triangle'

export type Vector2 = { x: number; y: number }

export type ForceReadings = {
  mode: ForceMode
  f1: Vector2
  f2: Vector2
  sum: Vector2
  f1Magnitude: number
  f2Magnitude: number
  sumMagnitude: number
  angleDeg: number
  rangeMax: number
  rangeMin: number
  rangeCurrent: number
  orthogonalMagnitude: number
  orthogonalAngleDeg: number
  fx: number
  fy: number
  gravity: number
  slopeAngleDeg: number
  downSlope: number
  normal: number
}

export function magnitude(vector: Vector2): number {
  return Math.hypot(vector.x, vector.y)
}

export function angleOf(vector: Vector2): number {
  return Math.atan2(vector.y, vector.x) * 180 / Math.PI
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function snapVector(vector: Vector2): Vector2 {
  const length = magnitude(vector)
  if (length < 0.001) return { x: 1, y: 0 }
  const snappedLength = Math.max(1, Math.round(length))
  return { x: vector.x / length * snappedLength, y: vector.y / length * snappedLength }
}

export function deriveForceReadings(input: {
  mode: ForceMode
  f1: Vector2
  f2: Vector2
  rangeF1: number
  rangeF2: number
  rangeAngleDeg: number
  orthogonalMagnitude: number
  orthogonalAngleDeg: number
  gravity: number
  slopeAngleDeg: number
}): ForceReadings {
  const f1Magnitude = magnitude(input.f1)
  const f2Magnitude = magnitude(input.f2)
  const sum = { x: input.f1.x + input.f2.x, y: input.f1.y + input.f2.y }
  const sumMagnitude = magnitude(sum)
  const includedAngle = Math.acos(clamp((input.f1.x * input.f2.x + input.f1.y * input.f2.y) / Math.max(0.001, f1Magnitude * f2Magnitude), -1, 1)) * 180 / Math.PI
  const rangeAngleRad = clamp(input.rangeAngleDeg, 0, 180) * Math.PI / 180
  const rangeCurrent = Math.sqrt(input.rangeF1 ** 2 + input.rangeF2 ** 2 + 2 * input.rangeF1 * input.rangeF2 * Math.cos(rangeAngleRad))
  const orthogonalAngleRad = input.orthogonalAngleDeg * Math.PI / 180
  const fx = input.orthogonalMagnitude * Math.cos(orthogonalAngleRad)
  const fy = input.orthogonalMagnitude * Math.sin(orthogonalAngleRad)
  const slopeAngleRad = clamp(input.slopeAngleDeg, 0, 90) * Math.PI / 180
  return {
    mode: input.mode,
    f1: input.f1,
    f2: input.f2,
    sum,
    f1Magnitude,
    f2Magnitude,
    sumMagnitude,
    angleDeg: includedAngle,
    rangeMax: input.rangeF1 + input.rangeF2,
    rangeMin: Math.abs(input.rangeF1 - input.rangeF2),
    rangeCurrent,
    orthogonalMagnitude: input.orthogonalMagnitude,
    orthogonalAngleDeg: input.orthogonalAngleDeg,
    fx,
    fy,
    gravity: input.gravity,
    slopeAngleDeg: input.slopeAngleDeg,
    downSlope: input.gravity * Math.sin(slopeAngleRad),
    normal: input.gravity * Math.cos(slopeAngleRad),
  }
}

export function buildRangeSweep(samples = 180): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const theta = index / (count - 1) * Math.PI
    return [index / (count - 1) * 180, Math.cos(theta)]
  }).map(([theta, value]) => [theta, value])
}
