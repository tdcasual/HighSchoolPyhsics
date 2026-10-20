export const GRAVITY = { earth: 9.8, moon: 1.62 } as const
export type GravityKey = keyof typeof GRAVITY

export type PendulumParams = {
  /** Length from the pivot to the bob's centre, m. */
  length: number
  /** Release angle from the vertical, degrees. */
  amplitudeDeg: number
  gravity: GravityKey
  /** Bob mass, kg (the period does not depend on it). */
  mass: number
}

export type PendulumState = {
  t: number
  /** Angle from the vertical, rad (positive to the right). */
  theta: number
  /** Angular velocity, rad/s. */
  omega: number
  /** Times at which θ crossed zero moving right (to measure the period). */
  crossings: number[]
}

const DT = 0.0005

export function smallAnglePeriod(p: PendulumParams): number {
  return 2 * Math.PI * Math.sqrt(p.length / GRAVITY[p.gravity])
}

export function releaseState(p: PendulumParams): PendulumState {
  return { t: 0, theta: (p.amplitudeDeg * Math.PI) / 180, omega: 0, crossings: [] }
}

/** Exact pendulum equation θ'' = −(g/L)·sinθ, integrated with RK4 (no small-angle approximation). */
export function advancePendulum(p: PendulumParams, state: PendulumState, seconds: number): PendulumState {
  const k = GRAVITY[p.gravity] / p.length
  const steps = Math.max(1, Math.ceil(seconds / DT))
  const dt = seconds / steps
  let { t, theta, omega } = state
  const crossings = [...state.crossings]
  for (let index = 0; index < steps; index++) {
    const f = (th: number) => -k * Math.sin(th)
    const k1t = omega
    const k1o = f(theta)
    const k2t = omega + (k1o * dt) / 2
    const k2o = f(theta + (k1t * dt) / 2)
    const k3t = omega + (k2o * dt) / 2
    const k3o = f(theta + (k2t * dt) / 2)
    const k4t = omega + k3o * dt
    const k4o = f(theta + k3t * dt)
    const nextTheta = theta + ((k1t + 2 * k2t + 2 * k3t + k4t) * dt) / 6
    const nextOmega = omega + ((k1o + 2 * k2o + 2 * k3o + k4o) * dt) / 6
    if (theta < 0 && nextTheta >= 0) {
      // Linear interpolation of the crossing instant.
      crossings.push(t + (dt * -theta) / (nextTheta - theta))
    }
    theta = nextTheta
    omega = nextOmega
    t += dt
  }
  return { t, theta, omega, crossings: crossings.slice(-20) }
}

/** Mean of the last full periods between rightward zero crossings, or null until two are seen. */
export function measuredPeriod(state: PendulumState): number | null {
  const c = state.crossings
  if (c.length < 2) return null
  return (c[c.length - 1] - c[0]) / (c.length - 1)
}
