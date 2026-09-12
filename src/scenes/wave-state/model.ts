export type WaveDirection = 'right' | 'left'

export type WaveParams = {
  amplitude: number
  wavelength: number
  period: number
  direction: WaveDirection
}

export type WaveParticle = {
  x: number
  y: number
  velocity: number
  acceleration: number
  velocityDirection: 'up' | 'down' | 'still'
  accelerationDirection: 'up' | 'down' | 'still'
}

export type WaveReadings = {
  waveSpeed: number
  probe: WaveParticle
  particles: WaveParticle[]
  phase: number
}

const TWO_PI = Math.PI * 2
const PROBE_X = 2
const EPSILON = 0.0001

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function phaseAt(x: number, time: number, params: WaveParams): number {
  const directionSign = params.direction === 'right' ? 1 : -1
  return TWO_PI * (time / Math.max(EPSILON, params.period) - directionSign * x / Math.max(EPSILON, params.wavelength))
}

export function waveDisplacement(x: number, time: number, params: WaveParams): number {
  return params.amplitude * Math.sin(phaseAt(x, time, params))
}

export function waveVelocity(x: number, time: number, params: WaveParams): number {
  const omega = TWO_PI / Math.max(EPSILON, params.period)
  return params.amplitude * omega * Math.cos(phaseAt(x, time, params))
}

export function waveAcceleration(x: number, time: number, params: WaveParams): number {
  const omega = TWO_PI / Math.max(EPSILON, params.period)
  return -params.amplitude * omega ** 2 * Math.sin(phaseAt(x, time, params))
}

function directionOf(value: number): 'up' | 'down' | 'still' {
  if (Math.abs(value) < EPSILON) return 'still'
  return value > 0 ? 'up' : 'down'
}

export function buildWavePoints(time: number, params: WaveParams, samples = 161): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const x = index / (count - 1) * 8
    return [x, waveDisplacement(x, time, params)]
  })
}

export function buildParticleStates(time: number, params: WaveParams): WaveParticle[] {
  return Array.from({ length: 9 }, (_, index) => {
    const x = index
    const y = waveDisplacement(x, time, params)
    const velocity = waveVelocity(x, time, params)
    const acceleration = waveAcceleration(x, time, params)
    return { x, y, velocity, acceleration, velocityDirection: directionOf(velocity), accelerationDirection: directionOf(acceleration) }
  })
}

export function deriveWaveReadings(time: number, params: WaveParams): WaveReadings {
  const particles = buildParticleStates(time, params)
  const probe = particles.find((particle) => particle.x === PROBE_X) ?? particles[2]
  return { waveSpeed: params.wavelength / Math.max(EPSILON, params.period), probe, particles, phase: phaseAt(PROBE_X, time, params) }
}

export function buildProbeTrace(params: WaveParams, samples = 96): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const time = index / (count - 1) * params.period
    return [time, waveDisplacement(PROBE_X, time, params)]
  })
}
