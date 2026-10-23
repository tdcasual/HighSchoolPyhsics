/** A point particle in the cyclotron, advanced with semi-implicit (symplectic) Euler. */
export type Vector3Like = {
  x: number
  y: number
  z: number
}

export type ParticleState = {
  position: Vector3Like
  velocity: Vector3Like
}

/** Velocity first, then position with the new velocity: keeps circular orbits from spiralling out. */
export function semiImplicitEulerStep(state: ParticleState, acceleration: Vector3Like, dt: number): ParticleState {
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
