export type ProjectileMode = 'trajectory' | 'data'

export type ProjectileParams = {
  initialSpeed: number
  gravity: number
  flashPeriod: number
}

export type ProjectilePoint = {
  index: number
  time: number
  x: number
  y: number
  deltaY: number
  vx: number
  vy: number
  speed: number
  angleDeg: number
}

export type ProjectileReadings = {
  time: number
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  angleDeg: number
  flightDuration: number
  range: number
  trajectoryCoefficient: number
}

const EPSILON = 0.0001

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function deriveProjectileReadings(params: ProjectileParams, time: number): ProjectileReadings {
  const t = Math.max(0, time)
  const vx = params.initialSpeed
  const vy = params.gravity * t
  const x = vx * t
  const y = 0.5 * params.gravity * t * t
  return { time: t, x, y, vx, vy, speed: Math.hypot(vx, vy), angleDeg: Math.atan2(vy, Math.max(EPSILON, vx)) * 180 / Math.PI, flightDuration: 2.4, range: vx * 2.4, trajectoryCoefficient: params.gravity / (2 * Math.max(EPSILON, vx * vx)) }
}

export function buildFlashPoints(params: ProjectileParams, count = 5): ProjectilePoint[] {
  const n = Math.max(2, Math.floor(count))
  return Array.from({ length: n }, (_, index) => {
    const time = index * params.flashPeriod
    const reading = deriveProjectileReadings(params, time)
    const previous = index === 0 ? null : deriveProjectileReadings(params, (index - 1) * params.flashPeriod)
    return { index, time, x: reading.x, y: reading.y, deltaY: previous ? reading.y - previous.y : 0, vx: reading.vx, vy: reading.vy, speed: reading.speed, angleDeg: reading.angleDeg }
  })
}

export function buildTrajectoryTrace(params: ProjectileParams, samples = 81): Array<[number, number]> {
  const count = Math.max(2, Math.floor(samples))
  const maxTime = Math.max(params.flashPeriod * 4, 0.6)
  return Array.from({ length: count }, (_, index) => {
    const reading = deriveProjectileReadings(params, maxTime * index / (count - 1))
    return [reading.x, reading.y]
  })
}

export function buildPositionTimeTrace(params: ProjectileParams, samples = 81): Array<[number, number, number]> {
  const count = Math.max(2, Math.floor(samples))
  const maxTime = Math.max(params.flashPeriod * 4, 0.6)
  return Array.from({ length: count }, (_, index) => {
    const time = maxTime * index / (count - 1)
    const reading = deriveProjectileReadings(params, time)
    return [time, reading.x, reading.y]
  })
}

