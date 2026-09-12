export type RotationDirection = 'cw' | 'ccw'
export type MagneticDirection = 'into' | 'out'
export type CircuitState = 'closed' | 'open'

export type FaradayDiscParams = {
  B: number
  omega: number
  radius: number
  externalResistance: number
  rotation: RotationDirection
  magnetic: MagneticDirection
  circuit: CircuitState
}

export type FaradayDiscReadings = {
  emf: number
  current: number
  power: number
  torque: number
  angularSpeed: number
  polarity: 'A−/B+' | 'A+/B−'
  direction: 'outward' | 'inward'
}

const INTERNAL_RESISTANCE = 0.05
const EPSILON = 0.0001

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function deriveFaradayDiscReadings(params: FaradayDiscParams): FaradayDiscReadings {
  const sign = (params.rotation === 'cw' ? 1 : -1) * (params.magnetic === 'into' ? 1 : -1)
  const magnitude = 0.5 * Math.abs(params.B) * Math.abs(params.omega) * params.radius ** 2
  const emf = sign * magnitude
  const totalResistance = Math.max(EPSILON, params.externalResistance + INTERNAL_RESISTANCE)
  const current = params.circuit === 'closed' ? emf / totalResistance : 0
  const power = Math.abs(emf * current)
  return {
    emf,
    current,
    power,
    torque: power / Math.max(EPSILON, Math.abs(params.omega)),
    angularSpeed: Math.abs(params.omega),
    polarity: emf >= 0 ? 'A−/B+' : 'A+/B−',
    direction: emf >= 0 ? 'outward' : 'inward',
  }
}

export function buildEmfTrace(params: FaradayDiscParams, samples = 65): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  const maxOmega = Math.max(20, params.omega * 1.25)
  return Array.from({ length: count }, (_, index) => {
    const omega = index / (count - 1) * maxOmega
    const readings = deriveFaradayDiscReadings({ ...params, omega })
    return [omega, readings.emf]
  })
}

export function buildDiscRimPoints(samples = 80): Array<[number, number]> {
  const count = Math.max(12, Math.floor(samples))
  return Array.from({ length: count + 1 }, (_, index) => {
    const angle = index / count * Math.PI * 2
    return [Math.cos(angle), Math.sin(angle)]
  })
}

export const FARADAY_CONSTANTS = { internalResistance: INTERNAL_RESISTANCE }
