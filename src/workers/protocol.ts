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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function assertFiniteVector(vector: Vector3Like, label: string): void {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y) || !Number.isFinite(vector.z)) {
    throw new Error(`${label} must be finite`)
  }
}

function isFiniteParticleState(value: unknown): value is ParticleState {
  if (!isRecord(value)) {
    return false
  }

  try {
    assertFiniteState(value as ParticleState)
    return true
  } catch {
    return false
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
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.requestId !== 'string' || !isRecord(value.payload)) {
    return false
  }

  if (value.type === 'step-result') {
    return isFiniteParticleState(value.payload.state)
  }

  if (value.type === 'error') {
    return typeof value.payload.message === 'string'
  }

  return false
}
