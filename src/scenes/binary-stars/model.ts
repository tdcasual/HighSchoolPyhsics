export type BinaryStarsParams = {
  mass1: number
  mass2: number
  separation: number
}

export type BinaryStarsReadings = {
  radius1: number
  radius2: number
  radiusRatio: number
  force: number
  omega: number
  period: number
  totalMass: number
}

const G = 100

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function deriveBinaryStarsReadings(params: BinaryStarsParams): BinaryStarsReadings {
  const mass1 = Math.max(0.1, params.mass1)
  const mass2 = Math.max(0.1, params.mass2)
  const separation = Math.max(1, params.separation)
  const totalMass = mass1 + mass2
  const radius1 = separation * mass2 / totalMass
  const radius2 = separation * mass1 / totalMass
  const force = G * mass1 * mass2 / separation ** 2
  const omega = Math.sqrt(G * totalMass / separation ** 3)
  return { radius1, radius2, radiusRatio: radius1 / Math.max(0.001, radius2), force, omega, period: Math.PI * 2 / Math.max(0.001, omega), totalMass }
}

export function buildBinaryStarsTrace(params: BinaryStarsParams, samples = 61): Array<[number, number, number]> {
  const count = Math.max(3, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const mass1 = 1 + index / (count - 1) * 5
    const readings = deriveBinaryStarsReadings({ ...params, mass1 })
    return [mass1, readings.radius1, readings.radius2]
  })
}

export function orbitalPhase(elapsed: number, omega: number): number {
  return (elapsed * omega) % (Math.PI * 2)
}
