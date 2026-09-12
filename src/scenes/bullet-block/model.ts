export type BulletBlockPhase = 'approach' | 'collision' | 'combined'

export type BulletBlockParams = { bulletSpeed: number; bulletMass: number; blockMass: number; resistance: number }

export type BulletBlockReadings = {
  phase: BulletBlockPhase
  time: number
  bulletSpeed: number
  blockSpeed: number
  commonSpeed: number
  initialMomentum: number
  totalMomentum: number
  bulletEnergy: number
  blockEnergy: number
  heat: number
  penetration: number
  maximumPenetration: number
  relativeSpeed: number
  bulletPosition: number
  blockPosition: number
}

const CONTACT_TIME = 0.4
const COLLISION_DURATION = 0.5
const EPSILON = 0.0001

export function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)) }

export function deriveBulletBlockReadings(params: BulletBlockParams, time: number): BulletBlockReadings {
  const t = Math.max(0, time)
  const commonSpeed = params.bulletMass * params.bulletSpeed / Math.max(EPSILON, params.bulletMass + params.blockMass)
  const initialMomentum = params.bulletMass * params.bulletSpeed
  const initialEnergy = 0.5 * params.bulletMass * params.bulletSpeed ** 2
  const commonEnergy = 0.5 * (params.bulletMass + params.blockMass) * commonSpeed ** 2
  const maxPenetration = Math.max(0, initialEnergy - commonEnergy) / Math.max(EPSILON, params.resistance)
  let phase: BulletBlockPhase = 'approach'
  let bulletSpeed = params.bulletSpeed
  let blockSpeed = 0
  let bulletPosition = -8 + params.bulletSpeed * t
  let blockPosition = 2
  let penetration = 0
  if (t >= CONTACT_TIME && t < CONTACT_TIME + COLLISION_DURATION) {
    phase = 'collision'
    const tau = t - CONTACT_TIME
    const u = tau / COLLISION_DURATION
    bulletSpeed = params.bulletSpeed - (params.bulletSpeed - commonSpeed) * u
    blockSpeed = commonSpeed * u
    penetration = maxPenetration * u
    bulletPosition = blockPosition + Math.min(1.25, penetration)
    blockPosition = 2 + 0.5 * blockSpeed * tau
  } else if (t >= CONTACT_TIME + COLLISION_DURATION) {
    phase = 'combined'
    bulletSpeed = commonSpeed
    blockSpeed = commonSpeed
    penetration = maxPenetration
    const postTime = t - CONTACT_TIME - COLLISION_DURATION
    blockPosition = 2 + 0.5 * commonSpeed * COLLISION_DURATION + commonSpeed * postTime
    bulletPosition = blockPosition + Math.min(1.25, penetration)
  }
  const bulletEnergy = 0.5 * params.bulletMass * bulletSpeed ** 2
  const blockEnergy = 0.5 * params.blockMass * blockSpeed ** 2
  const heat = Math.max(0, 0.5 * params.bulletMass * params.bulletSpeed ** 2 - bulletEnergy - blockEnergy)
  return { phase, time: t, bulletSpeed, blockSpeed, commonSpeed, initialMomentum, totalMomentum: params.bulletMass * bulletSpeed + params.blockMass * blockSpeed, bulletEnergy, blockEnergy, heat, penetration, maximumPenetration: maxPenetration, relativeSpeed: Math.abs(bulletSpeed - blockSpeed), bulletPosition, blockPosition }
}

export function buildSpeedTrace(params: BulletBlockParams, samples = 81): Array<[number, number, number]> {
  const count = Math.max(2, Math.floor(samples))
  const duration = 2.8
  return Array.from({ length: count }, (_, index) => {
    const t = duration * index / (count - 1)
    const r = deriveBulletBlockReadings(params, t)
    return [t, r.bulletSpeed, r.blockSpeed]
  })
}

export const BULLET_BLOCK_CONSTANTS = Object.freeze({ contactTime: CONTACT_TIME, collisionDuration: COLLISION_DURATION })
