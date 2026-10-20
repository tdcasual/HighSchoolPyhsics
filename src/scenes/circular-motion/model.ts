export const G = 9.8

export type CircularMode = 'turntable' | 'conical'

export type TurntableParams = {
  /** Block mass, kg. */
  mass: number
  /** Distance from the axis, m. */
  radius: number
  /** Angular speed, rad/s. */
  omega: number
  /** Static friction coefficient between block and table. */
  mu: number
}

export type ConicalParams = {
  mass: number
  /** String length, m. */
  length: number
  omega: number
}

export type TurntableReadings = {
  speed: number
  period: number
  acceleration: number
  /** Centripetal force the block needs, mω²r. */
  requiredForce: number
  /** Most static friction can supply, μmg. */
  maxFriction: number
  /** Required force exceeds μmg: the block slides off (离心运动). */
  slips: boolean
  /** ω at which the block starts to slide, √(μg/r). */
  criticalOmega: number
}

export function turntableReadings(p: TurntableParams): TurntableReadings {
  const requiredForce = p.mass * p.omega * p.omega * p.radius
  const maxFriction = p.mu * p.mass * G
  return {
    speed: p.omega * p.radius,
    period: (2 * Math.PI) / p.omega,
    acceleration: p.omega * p.omega * p.radius,
    requiredForce,
    maxFriction,
    slips: requiredForce > maxFriction + 1e-12,
    criticalOmega: Math.sqrt((p.mu * G) / p.radius),
  }
}

export type ConicalReadings = {
  /** Angle of the string from the vertical, rad (0 below the threshold ω). */
  angle: number
  /** Orbit radius L·sinθ, m. */
  radius: number
  /** Depth of the ball below the pivot, L·cosθ, m. */
  depth: number
  /** String tension: mω²L when swinging out, mg when hanging. */
  tension: number
  /** Net (centripetal) force, mg·tanθ. */
  centripetalForce: number
  period: number
  /** Below √(g/L) the ball hangs straight down. */
  thresholdOmega: number
}

/** Conical pendulum: T·sinθ = mω²L·sinθ and T·cosθ = mg give cosθ = g/(ω²L). */
export function conicalReadings(p: ConicalParams): ConicalReadings {
  const thresholdOmega = Math.sqrt(G / p.length)
  const cosAngle = p.omega > thresholdOmega ? G / (p.omega * p.omega * p.length) : 1
  const angle = Math.acos(Math.min(1, cosAngle))
  return {
    angle,
    radius: p.length * Math.sin(angle),
    depth: p.length * Math.cos(angle),
    tension: angle > 0 ? p.mass * p.omega * p.omega * p.length : p.mass * G,
    centripetalForce: p.mass * G * Math.tan(angle),
    period: (2 * Math.PI) / p.omega,
    thresholdOmega,
  }
}
