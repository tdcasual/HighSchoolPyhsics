export type EmWaveDirection = 'right' | 'left'
export type EmViewMode = '3d' | 'xy' | 'xz' | 'yz'

export type EmWaveParams = {
  amplitude: number
  wavelength: number
  speed: number
  direction: EmWaveDirection
}

export type EmFieldSample = {
  x: number
  e: number
  b: number
  phase: number
}

export type EmWaveReadings = {
  frequency: number
  waveNumber: number
  angularFrequency: number
  phase: number
  probe: EmFieldSample
  samples: EmFieldSample[]
  orthogonality: number
  propagationDirection: EmWaveDirection
}

const TWO_PI = Math.PI * 2
const EPSILON = 0.0001
export const PROBE_X = 4
export const WAVE_LENGTH = 8

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function wrapPhase(phase: number): number {
  const wrapped = phase % TWO_PI
  return wrapped < 0 ? wrapped + TWO_PI : wrapped
}

export function phaseAt(x: number, time: number, params: EmWaveParams): number {
  const directionSign = params.direction === 'right' ? 1 : -1
  const wavelength = Math.max(EPSILON, params.wavelength)
  return TWO_PI * ((time * params.speed) / wavelength - (directionSign * x) / wavelength)
}

export function buildFieldSamples(time: number, params: EmWaveParams, samples = 129): EmFieldSample[] {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const x = (index / (count - 1)) * WAVE_LENGTH
    const phase = phaseAt(x, time, params)
    const e = params.amplitude * Math.sin(phase)
    const b = (params.direction === 'right' ? 1 : -1) * e
    return { x, phase, e, b }
  })
}

export function deriveEmWaveReadings(time: number, params: EmWaveParams): EmWaveReadings {
  const samples = buildFieldSamples(time, params)
  const probe = samples.reduce(
    (closest, sample) => (Math.abs(sample.x - PROBE_X) < Math.abs(closest.x - PROBE_X) ? sample : closest),
    samples[0],
  )
  return {
    frequency: params.speed / Math.max(EPSILON, params.wavelength),
    waveNumber: TWO_PI / Math.max(EPSILON, params.wavelength),
    angularFrequency: (TWO_PI * params.speed) / Math.max(EPSILON, params.wavelength),
    phase: probe.phase,
    probe,
    samples,
    orthogonality: 0,
    propagationDirection: params.direction,
  }
}

export function buildFieldTrace(time: number, params: EmWaveParams, samples = 97): Array<[number, number, number]> {
  return buildFieldSamples(time, params, samples).map(({ x, e, b }) => [x, e, b])
}
