import { semiImplicitEulerStep } from '../core/integrators/semiImplicitEuler'
import { createSimController } from '../core/simController'
import type { ParticleState } from '../core/types'
import {
  assertValidStepPayload,
  isSimulationMessage,
  type SimulationMessage,
  type StepPayload,
  type StepRequestMessage,
} from './protocol'

export type SimulationStepper = {
  mode: 'worker' | 'local'
  step: (payload: StepPayload) => Promise<ParticleState>
  terminate: () => void
}

type WorkerMessageListener = (event: MessageEvent<unknown>) => void
type WorkerErrorListener = (event: ErrorEvent) => void

type WorkerLike = {
  postMessage: (message: StepRequestMessage) => void
  terminate: () => void
  addEventListener: {
    (type: 'message', listener: WorkerMessageListener): void
    (type: 'error', listener: WorkerErrorListener): void
    (type: 'messageerror', listener: WorkerMessageListener): void
  }
  removeEventListener: {
    (type: 'message', listener: WorkerMessageListener): void
    (type: 'error', listener: WorkerErrorListener): void
    (type: 'messageerror', listener: WorkerMessageListener): void
  }
}

type PendingStepRequest = {
  resolve: (state: ParticleState) => void
  reject: (error: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
}

const WORKER_STEP_TIMEOUT_MS = 4000

export function createLocalSimulationStepper(): SimulationStepper {
  const controller = createSimController(semiImplicitEulerStep)

  return {
    mode: 'local',
    async step(payload) {
      assertValidStepPayload(payload)
      return controller.tick(payload.state, payload.acceleration, payload.dt)
    },
    terminate() {
      // No resources to free in local mode.
    },
  }
}

export function createWorkerSimulationStepper(worker: WorkerLike): SimulationStepper {
  let requestSeq = 0
  const pending = new Map<string, PendingStepRequest>()

  const clearPendingRequest = (requestId: string): PendingStepRequest | null => {
    const handlers = pending.get(requestId)
    if (!handlers) {
      return null
    }
    pending.delete(requestId)
    clearTimeout(handlers.timeoutId)
    return handlers
  }

  const rejectAllPending = (error: Error): void => {
    pending.forEach((handlers) => {
      clearTimeout(handlers.timeoutId)
      handlers.reject(error)
    })
    pending.clear()
  }

  const onMessage = (event: MessageEvent<unknown>) => {
    if (!isSimulationMessage(event.data)) {
      return
    }

    const reply = event.data as SimulationMessage
    const handlers = clearPendingRequest(reply.requestId)
    if (!handlers) {
      return
    }

    if (reply.type === 'error') {
      handlers.reject(new Error(reply.payload.message))
      return
    }

    handlers.resolve(reply.payload.state)
  }

  const onError = (event: ErrorEvent) => {
    const reason = event.message?.trim() || 'Simulation worker error'
    rejectAllPending(new Error(reason))
  }

  const onMessageError = () => {
    rejectAllPending(new Error('Simulation worker message error'))
  }

  worker.addEventListener('message', onMessage)
  worker.addEventListener('error', onError)
  worker.addEventListener('messageerror', onMessageError)

  return {
    mode: 'worker',
    step(payload) {
      assertValidStepPayload(payload)

      return new Promise<ParticleState>((resolve, reject) => {
        requestSeq += 1
        const requestId = `req-${requestSeq}`
        const timeoutId = setTimeout(() => {
          const handlers = clearPendingRequest(requestId)
          if (!handlers) {
            return
          }
          handlers.reject(new Error(`Worker step timeout after ${WORKER_STEP_TIMEOUT_MS}ms`))
        }, WORKER_STEP_TIMEOUT_MS)

        pending.set(requestId, { resolve, reject, timeoutId })

        try {
          worker.postMessage({
            type: 'step',
            requestId,
            payload,
          })
        } catch (error) {
          const handlers = clearPendingRequest(requestId)
          if (!handlers) {
            return
          }
          handlers.reject(error instanceof Error ? error : new Error('Worker postMessage failed'))
        }
      })
    },
    terminate() {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      worker.removeEventListener('messageerror', onMessageError)
      rejectAllPending(new Error('Simulation stepper terminated'))
      worker.terminate()
    },
  }
}

export function createDefaultSimulationStepper(
  workerFactory?: () => WorkerLike,
): SimulationStepper {
  const local = createLocalSimulationStepper()
  const createWorker = workerFactory
    ? workerFactory
    : () =>
        new Worker(new URL('./sim.worker.ts', import.meta.url), {
          type: 'module',
        })

  if (typeof Worker === 'undefined') {
    return local
  }

  try {
    const workerStepper = createWorkerSimulationStepper(createWorker())
    local.terminate()
    return workerStepper
  } catch {
    return local
  }
}
