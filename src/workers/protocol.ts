import { assertFiniteState } from '../core/numeric-guards'
import type { ParticleState, Vector3Like } from '../core/types'

export type StepPayload = {
  state: ParticleState
  acceleration: Vector3Like
  dt: number
}

export type StepRequestMessage = {
  type: 'step'
  requestId: string
  payload: StepPayload
}

export type StepResultMessage = {
  type: 'step-result'
  requestId: string
  payload: {
    state: ParticleState
  }
}

export type StepErrorMessage = {
  type: 'error'
  requestId: string
  payload: {
    message: string
  }
}

export type SimulationMessage = StepResultMessage | StepErrorMessage

function assertFiniteVector(vector: Vector3Like, label: string): void {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y) || !Number.isFinite(vector.z)) {
    throw new Error(`${label} must be finite`) 
  }
}

export function assertValidStepPayload(payload: StepPayload): void {
  assertFiniteState(payload.state)
  assertFiniteVector(payload.acceleration, 'acceleration')

  if (!Number.isFinite(payload.dt) || payload.dt <= 0) {
    throw new Error('dt must be finite and > 0')
  }
}

export function isSimulationMessage(value: unknown): value is SimulationMessage {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<SimulationMessage>
  return (
    (candidate.type === 'step-result' || candidate.type === 'error') &&
    typeof candidate.requestId === 'string' &&
    typeof candidate.payload === 'object' &&
    candidate.payload !== null
  )
}
