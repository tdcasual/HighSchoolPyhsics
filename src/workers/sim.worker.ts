/// <reference lib="webworker" />
import { semiImplicitEulerStep } from '../core/integrators/semiImplicitEuler'
import type { StepErrorMessage, StepRequestMessage, StepResultMessage } from './protocol'
import { assertValidStepPayload } from './protocol'

const workerScope = self as DedicatedWorkerGlobalScope

workerScope.onmessage = (event: MessageEvent<StepRequestMessage>) => {
  const request = event.data
  if (!request || request.type !== 'step') {
    return
  }

  try {
    assertValidStepPayload(request.payload)

    const next = semiImplicitEulerStep(
      request.payload.state,
      request.payload.acceleration,
      request.payload.dt,
    )

    const response: StepResultMessage = {
      type: 'step-result',
      requestId: request.requestId,
      payload: { state: next },
    }
    workerScope.postMessage(response)
  } catch (error) {
    const response: StepErrorMessage = {
      type: 'error',
      requestId: request.requestId,
      payload: {
        message: error instanceof Error ? error.message : 'Unknown worker error',
      },
    }
    workerScope.postMessage(response)
  }
}
