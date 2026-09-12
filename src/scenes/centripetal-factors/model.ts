export type CentripetalPreset = 'mass' | 'radius' | 'angular'
export type BeltRatio = '1:1' | '1:2' | '2:1'

export type CentripetalParams = {
  preset: CentripetalPreset
  beltRatio: BeltRatio
  leftMassMultiple: 1 | 2
  leftRadiusMultiple: 1 | 2
  rightMassMultiple: 1 | 2
  omegaBase: number
}

export type CentripetalReadings = {
  preset: CentripetalPreset
  beltRatio: BeltRatio
  leftMass: number
  rightMass: number
  leftRadius: number
  rightRadius: number
  leftOmega: number
  rightOmega: number
  leftForce: number
  rightForce: number
  leftFactor: number
  rightFactor: number
  leftSpringMarks: number
  rightSpringMarks: number
  leftVelocity: number
  rightVelocity: number
  forceRatio: number
}

const R0 = 1
const M0 = 1
const OMEGA_MIN = 0.6
const OMEGA_MAX = 3.6

export const CENTRIPETAL_CONSTANTS = { r0: R0, m0: M0, omegaMin: OMEGA_MIN, omegaMax: OMEGA_MAX }

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function ratioParts(ratio: BeltRatio): [number, number] {
  if (ratio === '1:2') return [1, 2]
  if (ratio === '2:1') return [2, 1]
  return [1, 1]
}

export function deriveCentripetalReadings(params: CentripetalParams): CentripetalReadings {
  const [leftRatio, rightRatio] = ratioParts(params.beltRatio)
  const leftMass = params.leftMassMultiple * M0
  const rightMass = params.rightMassMultiple * M0
  const leftRadius = params.leftRadiusMultiple * R0
  const rightRadius = R0
  const leftOmega = clamp(params.omegaBase, OMEGA_MIN, OMEGA_MAX) * leftRatio
  const rightOmega = clamp(params.omegaBase, OMEGA_MIN, OMEGA_MAX) * rightRatio
  const leftFactor = leftMass * leftOmega ** 2 * leftRadius
  const rightFactor = rightMass * rightOmega ** 2 * rightRadius
  const forceScale = M0 * clamp(params.omegaBase, OMEGA_MIN, OMEGA_MAX) ** 2 * R0
  return {
    preset: params.preset,
    beltRatio: params.beltRatio,
    leftMass,
    rightMass,
    leftRadius,
    rightRadius,
    leftOmega,
    rightOmega,
    leftForce: leftFactor * 10,
    rightForce: rightFactor * 10,
    leftFactor: leftFactor / Math.max(0.001, forceScale),
    rightFactor: rightFactor / Math.max(0.001, forceScale),
    leftSpringMarks: clamp(leftFactor / 2, 0.6, 8),
    rightSpringMarks: clamp(rightFactor / 2, 0.6, 8),
    leftVelocity: leftOmega * leftRadius,
    rightVelocity: rightOmega * rightRadius,
    forceRatio: leftFactor / Math.max(0.001, rightFactor),
  }
}

export function buildCentripetalTrace(params: CentripetalParams, samples = 61): Array<[number, number, number]> {
  const count = Math.max(3, Math.floor(samples))
  const baseOmega = clamp(params.omegaBase, OMEGA_MIN, OMEGA_MAX)
  const normalization = Math.max(0.001, baseOmega ** 2)
  const values = Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1)
    if (params.preset === 'mass') {
      const mass = 0.5 + progress * 2.5
      return [mass, mass * baseOmega ** 2 * params.leftRadiusMultiple / normalization, baseOmega ** 2 / normalization] as [number, number, number]
    }
    if (params.preset === 'radius') {
      const radius = 0.5 + progress * 2.5
      return [radius, params.leftMassMultiple * baseOmega ** 2 * radius / normalization, params.rightMassMultiple * baseOmega ** 2 / normalization] as [number, number, number]
    }
    const omega = OMEGA_MIN + progress * (OMEGA_MAX - OMEGA_MIN)
    return [omega, params.leftMassMultiple * omega ** 2 * params.leftRadiusMultiple / normalization, params.rightMassMultiple * omega ** 2 / normalization] as [number, number, number]
  })
  return values.map(([x, left, right]) => [x, left, right])
}

export function phaseAt(elapsed: number, omega: number): number {
  return (elapsed * omega) % (Math.PI * 2)
}
