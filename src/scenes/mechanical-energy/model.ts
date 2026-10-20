export const G = 9.8
/** Bowl track y = a·x² spanning x ∈ [−3, 3] m and 2 m deep. */
export const BOWL_HALF_WIDTH = 3
export const BOWL_DEPTH = 2
const A = BOWL_DEPTH / (BOWL_HALF_WIDTH * BOWL_HALF_WIDTH)
/** Integration step; energy drifts < 0.1 % over a minute without friction. */
const DT = 0.0005

export type EnergyParams = {
  mass: number
  /** Release height above the lowest point, m. */
  releaseHeight: number
  /** Kinetic friction coefficient along the track (0 = smooth). */
  mu: number
}

export type EnergyMotion = {
  /** Horizontal position, m. */
  x: number
  /** Speed along the track, m/s (positive towards +x). */
  v: number
  t: number
  /** Heat produced by friction so far, J. */
  heat: number
  /** Static friction holds the block: the run is over. */
  stopped: boolean
}

export const trackY = (x: number) => A * x * x
const trackSlope = (x: number) => 2 * A * x

export function releaseMotion(p: EnergyParams): EnergyMotion {
  return { x: -Math.sqrt(p.releaseHeight / A), v: 0, t: 0, heat: 0, stopped: false }
}

type Local = { cos: number; sin: number; normalPerMass: number }

function local(x: number, v: number): Local {
  const slope = trackSlope(x)
  const norm = Math.sqrt(1 + slope * slope)
  const curvature = (2 * A) / (norm * norm * norm)
  return { cos: 1 / norm, sin: slope / norm, normalPerMass: Math.max(0, (G / norm) + curvature * v * v) }
}

/** dx/dt and dv/dt for sliding motion along the track (friction opposes the current velocity). */
function derivative(p: EnergyParams, x: number, v: number, direction: number): [number, number] {
  const { cos, sin, normalPerMass } = local(x, v)
  return [v * cos, -G * sin - p.mu * normalPerMass * direction]
}

/**
 * Advance a block sliding on the bowl with RK4. Along the track: dv/dt = −g·sinα − μ·N/m·sign(v),
 * where the normal force N = m(g·cosα + κv²) includes the curvature term, so friction losses are
 * right. Static friction holds the block once it is at rest where |g·sinα| ≤ μ·N/m.
 */
export function advanceMotion(p: EnergyParams, motion: EnergyMotion, seconds: number): EnergyMotion {
  if (motion.stopped) return motion
  let { x, v, heat } = motion
  const steps = Math.max(1, Math.ceil(seconds / DT))
  const dt = seconds / steps
  for (let index = 0; index < steps; index++) {
    const here = local(x, v)
    if (p.mu > 0 && Math.abs(v) < 1e-3 && Math.abs(G * here.sin) <= p.mu * here.normalPerMass) {
      return { x, v: 0, t: motion.t + index * dt, heat, stopped: true }
    }
    // Friction direction is fixed over the step (sliding direction, or downhill when starting).
    const direction = p.mu > 0 ? (v !== 0 ? Math.sign(v) : -Math.sign(here.sin)) : 0
    const k1 = derivative(p, x, v, direction)
    const k2 = derivative(p, x + (k1[0] * dt) / 2, v + (k1[1] * dt) / 2, direction)
    const k3 = derivative(p, x + (k2[0] * dt) / 2, v + (k2[1] * dt) / 2, direction)
    const k4 = derivative(p, x + k3[0] * dt, v + k3[1] * dt, direction)
    let nextV = v + ((k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) * dt) / 6
    const nextX = x + ((k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) * dt) / 6
    // Friction can stop the block but never push it backwards.
    if (direction !== 0 && v !== 0 && Math.sign(nextV) !== Math.sign(v)) nextV = 0
    heat += p.mass * p.mu * local(nextX, (v + nextV) / 2).normalPerMass * Math.abs((v + nextV) / 2) * dt
    x = nextX
    v = nextV
  }
  return { x, v, t: motion.t + seconds, heat, stopped: false }
}

export type Energies = { kinetic: number; potential: number; mechanical: number; heat: number; height: number }

export function energiesOf(p: EnergyParams, motion: EnergyMotion): Energies {
  const kinetic = 0.5 * p.mass * motion.v * motion.v
  const height = trackY(motion.x)
  const potential = p.mass * G * height
  return { kinetic, potential, mechanical: kinetic + potential, heat: motion.heat, height }
}
