import type { Vector3Like } from '../../core/types'
import type { CyclotronConfig } from './model'

export function computeCyclotronAcceleration(
  state: { position: Vector3Like; velocity: Vector3Like },
  config: CyclotronConfig,
): Vector3Like {
  const qOverM = config.chargeC / config.massKg
  const b = config.magneticFieldT
  const gapHalfWidthM = Math.max(0, config.gapHalfWidthM)
  const inGap = Math.abs(state.position.x) <= gapHalfWidthM
  const crossingDirection = state.velocity.x === 0 ? 0 : Math.sign(state.velocity.x)
  const electricFieldX = inGap ? crossingDirection * config.electricFieldVPerM : 0

  // v x B with B = (0, 0, B), plus RF-like electric boost only in dee gap.
  return {
    x: qOverM * (state.velocity.y * b + electricFieldX),
    y: qOverM * (-state.velocity.x * b),
    z: 0,
  }
}
