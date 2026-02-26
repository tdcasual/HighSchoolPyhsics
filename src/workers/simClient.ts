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

type WorkerLike = {
  postMessage: (message: StepRequestMessage) => void
  terminate: () => void
  addEventListener: (type: 'message', listener: (event: MessageEvent<unknown>) => void) => void
  removeEventListener: (type: 'message', listener: (event: MessageEvent<unknown>) => void) => void
}

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
  const pending = new Map<string, { resolve: (state: ParticleState) => void; reject: (error: Error) => void }>()

  const onMessage = (event: MessageEvent<unknown>) => {
    if (!isSimulationMessage(event.data)) {
      return
    }

    const reply = event.data as SimulationMessage
    const handlers = pending.get(reply.requestId)
    if (!handlers) {
      return
    }

    pending.delete(reply.requestId)

    if (reply.type === 'error') {
      handlers.reject(new Error(reply.payload.message))
      return
    }

    handlers.resolve(reply.payload.state)
  }

  worker.addEventListener('message', onMessage)

  return {
    mode: 'worker',
    step(payload) {
      assertValidStepPayload(payload)

      return new Promise<ParticleState>((resolve, reject) => {
        requestSeq += 1
        const requestId = `req-${requestSeq}`
        pending.set(requestId, { resolve, reject })
        worker.postMessage({
          type: 'step',
          requestId,
          payload,
        })
      })
    },
    terminate() {
      worker.removeEventListener('message', onMessage)
      pending.forEach(({ reject }) => reject(new Error('Simulation stepper terminated')))
      pending.clear()
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
