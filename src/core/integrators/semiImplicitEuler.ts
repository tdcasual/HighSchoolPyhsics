import type { ParticleState, Vector3Like } from '../types'

export function semiImplicitEulerStep(
  state: ParticleState,
  acceleration: Vector3Like,
  dt: number,
): ParticleState {
  const velocity = {
    x: state.velocity.x + acceleration.x * dt,
    y: state.velocity.y + acceleration.y * dt,
    z: state.velocity.z + acceleration.z * dt,
  }

  return {
    velocity,
    position: {
      x: state.position.x + velocity.x * dt,
      y: state.position.y + velocity.y * dt,
      z: state.position.z + velocity.z * dt,
    },
  }
}
