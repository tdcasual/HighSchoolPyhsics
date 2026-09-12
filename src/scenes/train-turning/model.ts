export type TrainStatus = 'low' | 'ideal' | 'high'

export type TrainParams = {
  speed: number
  angleDeg: number
  radius: number
}

export type TrainReadings = {
  idealSpeed: number
  radialAcceleration: number
  normalForce: number
  sideForce: number
  resultantForce: number
  speedRatio: number
  status: TrainStatus
}

const GRAVITY = 9.8
const MASS = 1000
const EPSILON = 0.0001

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function deriveTrainReadings(params: TrainParams): TrainReadings {
  const theta = params.angleDeg * Math.PI / 180
  const radius = Math.max(EPSILON, params.radius)
  const radialAcceleration = params.speed ** 2 / radius
  const idealSpeed = Math.sqrt(Math.max(0, radius * GRAVITY * Math.tan(theta)))
  const normalForce = MASS * (GRAVITY * Math.cos(theta) + radialAcceleration * Math.sin(theta))
  const sideForce = MASS * (radialAcceleration * Math.cos(theta) - GRAVITY * Math.sin(theta))
  const resultantForce = MASS * radialAcceleration
  const speedRatio = idealSpeed < EPSILON ? Infinity : params.speed / idealSpeed
  const delta = params.speed - idealSpeed
  const status: TrainStatus = Math.abs(delta) <= Math.max(0.25, idealSpeed * 0.025) ? 'ideal' : delta < 0 ? 'low' : 'high'
  return { idealSpeed, radialAcceleration, normalForce, sideForce, resultantForce, speedRatio, status }
}

export function buildForceTrace(params: TrainParams, samples = 65): Array<[number, number, number]> {
  const count = Math.max(2, Math.floor(samples))
  const maxSpeed = Math.max(35, params.speed * 1.35)
  return Array.from({ length: count }, (_, index) => {
    const speed = index / (count - 1) * maxSpeed
    const readings = deriveTrainReadings({ ...params, speed })
    return [speed, readings.sideForce, readings.normalForce]
  })
}

export function buildOrbitPoints(elapsed: number, params: TrainParams, samples = 64): Array<[number, number]> {
  const count = Math.max(8, Math.floor(samples))
  const phase = elapsed * params.speed / Math.max(EPSILON, params.radius)
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI * 0.35 + index / (count - 1) * Math.PI * 1.7
    return [Math.cos(angle) * 1.35, Math.sin(angle) * 0.8]
  }).map(([x, y]) => [x, y + Math.sin(phase) * 0.02])
}

export const TRAIN_CONSTANTS = { gravity: GRAVITY, mass: MASS }
