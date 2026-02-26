import type { ParticleState, Vector3Like } from './types'

function isFiniteVector(vector: Vector3Like): boolean {
  return Number.isFinite(vector.x) && Number.isFinite(vector.y) && Number.isFinite(vector.z)
}

export function assertFiniteState(state: ParticleState): void {
  if (!isFiniteVector(state.position) || !isFiniteVector(state.velocity)) {
    throw new Error('Non-finite particle state')
  }
}
