import { assertFiniteState } from './numeric-guards'
import type { ParticleState, Vector3Like } from './types'

export type StepFunction = (
  state: ParticleState,
  acceleration: Vector3Like,
  dt: number,
) => ParticleState

export type SimController = {
  tick: (state: ParticleState, acceleration: Vector3Like, dt: number) => ParticleState
}

export function createSimController(step: StepFunction): SimController {
  return {
    tick(state, acceleration, dt) {
      assertFiniteState(state)
      const next = step(state, acceleration, dt)
      assertFiniteState(next)
      return next
    },
  }
}
