import type { ParticleState } from '../../core/types'
import { stepCyclotronState, type CyclotronConfig } from './model'

/** Integration resolution: Boris steps per cyclotron turn (accurate to <0.1% energy over the run). */
export const STEPS_PER_TURN = 400
/** Samples (trail points, energy history) per turn. */
export const SAMPLES_PER_TURN = 40

export type CyclotronRun = {
  particle: ParticleState
  timeS: number
  /** The orbit reached the D-box rim: the particle is extracted and the run ends. */
  extracted: boolean
}

export type CyclotronSample = { particle: ParticleState; timeS: number }

export function cyclotronPeriodS(config: CyclotronConfig): number {
  const denominator = Math.abs(config.chargeC * config.magneticFieldT)
  return denominator > 0 ? (2 * Math.PI * config.massKg) / denominator : Number.POSITIVE_INFINITY
}

/**
 * Advances the full Lorentz-force simulation (Boris push, RF field only inside the gap) by
 * `simSeconds` of physical time, in steps of at most T/STEPS_PER_TURN. Calls `onSample`
 * SAMPLES_PER_TURN times per turn and stops at the D-box rim.
 */
export function advanceCyclotronRun(
  run: CyclotronRun,
  config: CyclotronConfig,
  simSeconds: number,
  deeRadiusM: number,
  onSample?: (sample: CyclotronSample) => void,
): CyclotronRun {
  if (run.extracted || !(simSeconds > 0)) return run
  const periodS = cyclotronPeriodS(config)
  if (!Number.isFinite(periodS)) return run
  const maxStepS = periodS / STEPS_PER_TURN
  const sampleEveryS = periodS / SAMPLES_PER_TURN
  const steps = Math.ceil(simSeconds / maxStepS)
  const dt = simSeconds / steps

  let particle = run.particle
  let timeS = run.timeS
  let nextSampleS = Math.floor(timeS / sampleEveryS + 1) * sampleEveryS
  for (let index = 0; index < steps; index++) {
    particle = stepCyclotronState(particle, config, dt, timeS)
    timeS += dt
    if (Math.hypot(particle.position.x, particle.position.y) >= deeRadiusM) {
      onSample?.({ particle, timeS })
      return { particle, timeS, extracted: true }
    }
    if (timeS >= nextSampleS) {
      onSample?.({ particle, timeS })
      nextSampleS += sampleEveryS
    }
  }
  return { particle, timeS, extracted: false }
}

export function kineticEnergyJ(particle: ParticleState, massKg: number): number {
  const { x, y, z } = particle.velocity
  return 0.5 * massKg * (x * x + y * y + z * z)
}
