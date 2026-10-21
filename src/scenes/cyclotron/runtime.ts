import type { Vector3Like } from './particle'
import type { CyclotronConfig } from './model'
import { evaluateGapVoltageAtTime } from './trace'

function deriveGapElectricFieldX(
  state: { position: Vector3Like },
  config: CyclotronConfig,
  timeS: number,
): number {
  const inGap = Math.abs(state.position.x) <= Math.max(0, config.gapHalfWidthM)
  if (!inGap) {
    return 0
  }

  const angularFrequency = Math.abs(config.chargeC * config.magneticFieldT) / config.massKg
  const periodS = angularFrequency > 0 ? (2 * Math.PI) / angularFrequency : 1
  const fieldPolarity = Math.sign(config.magneticFieldT) || 1
  return fieldPolarity * evaluateGapVoltageAtTime(timeS, config.electricFieldVPerM, periodS)
}

export function computeCyclotronAcceleration(
  state: { position: Vector3Like; velocity: Vector3Like },
  config: CyclotronConfig,
  timeS = 0,
): Vector3Like {
  const qOverM = config.chargeC / config.massKg
  const b = config.magneticFieldT
  const electricFieldX = deriveGapElectricFieldX(state, config, timeS)

  // B points along scene Y. RF voltage follows the cyclotron period so it
  // reverses between successive gap crossings instead of following velocity.
  return {
    x: qOverM * (state.velocity.y * b + electricFieldX),
    y: qOverM * (-state.velocity.x * b),
    z: 0,
  }
}

export function computeCyclotronStepAcceleration(
  state: { position: Vector3Like; velocity: Vector3Like },
  config: CyclotronConfig,
  timeS: number,
  dt: number,
): Vector3Like {
  if (!Number.isFinite(dt) || dt <= 0) {
    return computeCyclotronAcceleration(state, config, timeS)
  }

  const qOverM = config.chargeC / config.massKg
  const magneticRotation = qOverM * config.magneticFieldT * dt / 2
  const rotationScale = (2 * magneticRotation) / (1 + magneticRotation * magneticRotation)
  const electricHalfImpulse = qOverM * deriveGapElectricFieldX(state, config, timeS) * dt / 2

  const vxMinus = state.velocity.x + electricHalfImpulse
  const vyMinus = state.velocity.y
  const vxPrime = vxMinus + vyMinus * magneticRotation
  const vyPrime = vyMinus - vxMinus * magneticRotation
  const vxPlus = vxMinus + vyPrime * rotationScale
  const vyPlus = vyMinus - vxPrime * rotationScale
  const vxNext = vxPlus + electricHalfImpulse

  return {
    x: (vxNext - state.velocity.x) / dt,
    y: (vyPlus - state.velocity.y) / dt,
    z: 0,
  }
}
