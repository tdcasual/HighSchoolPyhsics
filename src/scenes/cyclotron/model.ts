import { semiImplicitEulerStep } from '../../core/integrators/semiImplicitEuler'
import type { ParticleState } from '../../core/types'
import { computeCyclotronAcceleration } from './runtime'

export type CyclotronConfig = {
  chargeC: number
  massKg: number
  magneticFieldT: number
  electricFieldVPerM: number
  gapHalfWidthM: number
}

export type CyclotronReadings = {
  speed: number
  periodS: number
  radiusM: number
  kineticEnergyJ: number
}

export function deriveCyclotronLaunchState(
  config: CyclotronConfig,
  launchSpeedMps: number,
): ParticleState {
  const speed = Math.max(1, Math.abs(launchSpeedMps))
  const orientation = config.chargeC * config.magneticFieldT
  const launchVx = orientation < 0 ? -speed : speed

  // Adaptive launch offset: place the particle so the guiding center
  // of the first orbit sits at the origin.
  // Guiding center = (x₀ + v_y/ω, y₀ − v_x/ω) where ω = qB/m.
  // With v_y = 0, center_y = y₀ − v_x/ω = 0  →  y₀ = v_x/ω = r₀
  const qAbs = Math.abs(config.chargeC)
  const bAbs = Math.abs(config.magneticFieldT)
  const r0 = bAbs > 0 ? (config.massKg * speed) / (qAbs * bAbs) : 0

  return {
    position: { x: 0, y: r0, z: 0 },
    velocity: { x: launchVx, y: 0, z: 0 },
  }
}

export function stepCyclotronState(
  state: ParticleState,
  config: CyclotronConfig,
  dt: number,
): ParticleState {
  const acceleration = computeCyclotronAcceleration(state, config)

  return semiImplicitEulerStep(state, acceleration, dt)
}

export function deriveCyclotronReadings(
  state: ParticleState,
  config: CyclotronConfig,
): CyclotronReadings {
  const speed = Math.hypot(state.velocity.x, state.velocity.y, state.velocity.z)
  const qAbs = Math.abs(config.chargeC)
  const bAbs = Math.abs(config.magneticFieldT)
  const denominator = qAbs * bAbs

  return {
    speed,
    periodS: denominator === 0 ? Number.POSITIVE_INFINITY : (2 * Math.PI * config.massKg) / denominator,
    radiusM: denominator === 0 ? Number.POSITIVE_INFINITY : (config.massKg * speed) / denominator,
    kineticEnergyJ: 0.5 * config.massKg * speed * speed,
  }
}
