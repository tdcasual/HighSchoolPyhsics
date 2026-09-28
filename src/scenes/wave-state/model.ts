export type WaveDirection = 'right' | 'left'
export type WaveStartDirection = 'up' | 'down'
export type WavePreset = 'baseline' | 'leftward' | 'double-frequency' | 'double-amplitude'
export type WaveParams = {
  amplitude: number
  wavelength: number
  period: number
  direction: WaveDirection
  startDirection?: WaveStartDirection
}
export type WaveParticle = {
  x: number
  y: number
  velocity: number
  acceleration: number
  velocityDirection: 'up' | 'down' | 'still'
  accelerationDirection: 'up' | 'down' | 'still'
  hasReached: boolean
  arrivalTime: number
}
export type WaveReadings = {
  waveSpeed: number
  frequency: number
  probe: WaveParticle
  particles: WaveParticle[]
  phase: number
  wavefrontX: number
  probeArrivalTime: number
  probeReached: boolean
}
const TWO_PI = Math.PI * 2
export const WAVE_DOMAIN_LENGTH = 8
export const DEFAULT_PROBE_X = 6
const EPSILON = 0.0001
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
export function waveSpeed(params: WaveParams): number {
  return Math.max(0, params.wavelength) / Math.max(EPSILON, params.period)
}
export function waveArrivalTime(x: number, params: WaveParams): number {
  const clampedX = clamp(x, 0, WAVE_DOMAIN_LENGTH)
  const distance = params.direction === 'right' ? clampedX : WAVE_DOMAIN_LENGTH - clampedX
  return distance / Math.max(EPSILON, waveSpeed(params))
}
export function wavefrontPosition(time: number, params: WaveParams): number {
  const distance = clamp(Math.max(0, time) * waveSpeed(params), 0, WAVE_DOMAIN_LENGTH)
  return params.direction === 'right' ? distance : WAVE_DOMAIN_LENGTH - distance
}
export function hasWaveReached(x: number, time: number, params: WaveParams): boolean {
  return time + EPSILON >= waveArrivalTime(x, params)
}
export function phaseAt(x: number, time: number, params: WaveParams): number {
  if (!hasWaveReached(x, time, params)) return 0
  const elapsedSinceArrival = Math.max(0, time - waveArrivalTime(x, params))
  return TWO_PI * elapsedSinceArrival / Math.max(EPSILON, params.period)
}
function startSign(params: WaveParams): number {
  return (params.startDirection ?? 'up') === 'up' ? 1 : -1
}
export function waveDisplacement(x: number, time: number, params: WaveParams): number {
  if (!hasWaveReached(x, time, params)) return 0
  return startSign(params) * params.amplitude * Math.sin(phaseAt(x, time, params))
}
export function waveVelocity(x: number, time: number, params: WaveParams): number {
  if (!hasWaveReached(x, time, params)) return 0
  const omega = TWO_PI / Math.max(EPSILON, params.period)
  return startSign(params) * params.amplitude * omega * Math.cos(phaseAt(x, time, params))
}
export function waveAcceleration(x: number, time: number, params: WaveParams): number {
  const omega = TWO_PI / Math.max(EPSILON, params.period)
  return -(omega ** 2) * waveDisplacement(x, time, params)
}
function directionOf(value: number): 'up' | 'down' | 'still' {
  if (Math.abs(value) < EPSILON) return 'still'
  return value > 0 ? 'up' : 'down'
}
function particleAt(x: number, time: number, params: WaveParams): WaveParticle {
  const y = waveDisplacement(x, time, params)
  const velocity = waveVelocity(x, time, params)
  const acceleration = waveAcceleration(x, time, params)
  return {
    x, y, velocity, acceleration,
    velocityDirection: directionOf(velocity),
    accelerationDirection: directionOf(acceleration),
    hasReached: hasWaveReached(x, time, params),
    arrivalTime: waveArrivalTime(x, params),
  }
}
export function buildWavePoints(time: number, params: WaveParams, samples = 161): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const x = index / (count - 1) * WAVE_DOMAIN_LENGTH
    return [x, waveDisplacement(x, time, params)]
  })
}
export function buildParticleStates(time: number, params: WaveParams): WaveParticle[] {
  return Array.from({ length: WAVE_DOMAIN_LENGTH + 1 }, (_, index) => particleAt(index, time, params))
}
export function deriveWaveReadings(time: number, params: WaveParams, probeX = DEFAULT_PROBE_X): WaveReadings {
  const particles = buildParticleStates(time, params)
  const probe = particleAt(clamp(probeX, 0, WAVE_DOMAIN_LENGTH), time, params)
  return {
    waveSpeed: waveSpeed(params),
    frequency: 1 / Math.max(EPSILON, params.period),
    probe,
    particles,
    phase: phaseAt(probe.x, time, params),
    wavefrontX: wavefrontPosition(time, params),
    probeArrivalTime: probe.arrivalTime,
    probeReached: probe.hasReached,
  }
}
export function buildProbeTrace(params: WaveParams, samples = 96, probeX = DEFAULT_PROBE_X): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  const endTime = waveArrivalTime(probeX, params) + Math.max(EPSILON, params.period)
  return Array.from({ length: count }, (_, index) => {
    const time = index / (count - 1) * endTime
    return [time, waveDisplacement(probeX, time, params)]
  })
}
