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
  rangeAngleDeg: number
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

export function resultantMagnitude(f1: number, f2: number, angleDeg: number): number {
  const angleRad = clamp(angleDeg, 0, 180) * Math.PI / 180
  return Math.sqrt(f1 ** 2 + f2 ** 2 + 2 * f1 * f2 * Math.cos(angleRad))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeAngleDeg(angle: number): number {
  const normalized = ((angle % 360) + 360) % 360
  return normalized > 180 ? normalized - 360 : normalized
}

export function snapVector(vector: Vector2, reference?: Vector2): Vector2 {
  const length = magnitude(vector)
  if (length < 0.001) return { x: 1, y: 0 }
  const snappedLength = Math.max(1, Math.round(length))
  let angle = angleOf(vector)
  if (reference && magnitude(reference) > 0.001) {
    const referenceAngle = angleOf(reference)
    const relativeAngle = normalizeAngleDeg(angle - referenceAngle)
    const specialAngles = [30, 45, 60, 90, 120]
    const nearest = specialAngles.reduce((best, candidate) => Math.abs(candidate - Math.abs(relativeAngle)) < Math.abs(best - Math.abs(relativeAngle)) ? candidate : best, specialAngles[0])
    if (Math.abs(nearest - Math.abs(relativeAngle)) <= 4) {
      angle = referenceAngle + Math.sign(relativeAngle || 1) * nearest
    }
  }
  const radians = angle * Math.PI / 180
  return { x: Math.cos(radians) * snappedLength, y: Math.sin(radians) * snappedLength }
}

export function resolveRangeAngle(baseAngleDeg: number, sweep: boolean, running: boolean, elapsed: number): number {
  return clamp(baseAngleDeg + (sweep && running ? Math.sin(elapsed * 1.2) * 8 : 0), 0, 180)
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
  const rangeAngleDeg = clamp(input.rangeAngleDeg, 0, 180)
  const rangeCurrent = resultantMagnitude(input.rangeF1, input.rangeF2, rangeAngleDeg)
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
    rangeAngleDeg,
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

export function buildRangeSweep(rangeF1 = 40, rangeF2 = 30, samples = 180): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const angleDeg = index / (count - 1) * 180
    return [angleDeg, resultantMagnitude(rangeF1, rangeF2, angleDeg)]
  })
}
