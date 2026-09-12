export type MechanicalWaveParams = {
  amplitude: number
  wavelength: number
  period: number
  probeX: number
}

export type MechanicalWaveReadings = {
  speed: number
  phase: number
  displacement: number
  velocity: number
  arrivalTime: number
}

const TWO_PI = Math.PI * 2
const EPSILON = 0.0001
export const SPACE_LENGTH = 72
export const TIME_LENGTH = 8

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function phaseAt(x: number, time: number, params: MechanicalWaveParams): number {
  return TWO_PI * (time / Math.max(EPSILON, params.period) - x / Math.max(EPSILON, params.wavelength))
}

export function displacementAt(x: number, time: number, params: MechanicalWaveParams): number {
  return params.amplitude * Math.sin(phaseAt(x, time, params))
}

export function velocityAt(x: number, time: number, params: MechanicalWaveParams): number {
  return params.amplitude * TWO_PI / Math.max(EPSILON, params.period) * Math.cos(phaseAt(x, time, params))
}

export function deriveMechanicalWaveReadings(time: number, params: MechanicalWaveParams): MechanicalWaveReadings {
  return {
    speed: params.wavelength / Math.max(EPSILON, params.period),
    phase: phaseAt(params.probeX, time, params),
    displacement: displacementAt(params.probeX, time, params),
    velocity: velocityAt(params.probeX, time, params),
    arrivalTime: params.probeX / Math.max(EPSILON, params.wavelength / Math.max(EPSILON, params.period)),
  }
}

export function buildSpatialWave(time: number, params: MechanicalWaveParams, samples = 97): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const x = index / (count - 1) * SPACE_LENGTH
    return [x, displacementAt(x, time, params)]
  })
}

export function buildTemporalWave(params: MechanicalWaveParams, samples = 97): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const time = index / (count - 1) * TIME_LENGTH
    const arrival = params.probeX / Math.max(EPSILON, params.wavelength / Math.max(EPSILON, params.period))
    return [time, time < arrival ? 0 : displacementAt(params.probeX, time, params)]
  })
}
