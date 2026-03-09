import { describe, expect, it, vi } from 'vitest'
import { createDefaultSimulationStepper, createWorkerSimulationStepper } from '../simClient'

type MessageListener = (event: MessageEvent<unknown>) => void
type ErrorListener = (event: ErrorEvent) => void

class FakeWorker {
  private readonly messageListeners = new Set<MessageListener>()
  private readonly errorListeners = new Set<ErrorListener>()
  private readonly messageErrorListeners = new Set<MessageListener>()

  postMessage(message: unknown): void {
    void message
    // Intentionally no reply to simulate a stalled worker.
  }

  terminate(): void {
    // No-op for tests.
  }

  addEventListener(type: 'message' | 'error' | 'messageerror', listener: MessageListener | ErrorListener): void {
    if (type === 'message') {
      this.messageListeners.add(listener as MessageListener)
      return
    }
    if (type === 'error') {
      this.errorListeners.add(listener as ErrorListener)
      return
    }
    this.messageErrorListeners.add(listener as MessageListener)
  }

  removeEventListener(type: 'message' | 'error' | 'messageerror', listener: MessageListener | ErrorListener): void {
    if (type === 'message') {
      this.messageListeners.delete(listener as MessageListener)
      return
    }
    if (type === 'error') {
      this.errorListeners.delete(listener as ErrorListener)
      return
    }
    this.messageErrorListeners.delete(listener as MessageListener)
  }

  emitMessage(data: unknown): void {
    this.messageListeners.forEach((listener) => listener({ data } as MessageEvent<unknown>))
  }

  emitError(event: Partial<ErrorEvent>): void {
    this.errorListeners.forEach((listener) => listener(event as ErrorEvent))
  }
}

function createValidStepPayload() {
  return {
    state: {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 1, y: 0, z: 0 },
    },
    acceleration: { x: 0, y: 0, z: 0 },
    dt: 1,
  }
}

describe('default simulation stepper', () => {
  it('creates a worker stepper when worker factory succeeds', () => {
    const stepper = createDefaultSimulationStepper(() => new FakeWorker())
    expect(stepper.mode).toBe('worker')
    stepper.terminate()
  })

  it('throws when Worker API is unavailable and no factory override is provided', () => {
    const originalWorkerDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Worker')
    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      value: undefined,
    })

    try {
      expect(() => createDefaultSimulationStepper()).toThrow(/worker api is unavailable/i)
    } finally {
      if (originalWorkerDescriptor) {
        Object.defineProperty(globalThis, 'Worker', originalWorkerDescriptor)
      } else {
        Reflect.deleteProperty(globalThis, 'Worker')
      }
    }
  })

  it('throws when worker factory fails', () => {
    expect(() =>
      createDefaultSimulationStepper(() => {
        throw new Error('factory boom')
      }),
    ).toThrow(/factory boom/i)
  })
})

describe('worker simulation stepper', () => {
  it('rejects stalled requests after timeout', async () => {
    vi.useFakeTimers()
    const worker = new FakeWorker()
    const stepper = createWorkerSimulationStepper(worker)

    try {
      const pending = stepper.step(createValidStepPayload())
      const outcome = pending.then(
        () => ({ status: 'resolved' as const }),
        (error) => ({ status: 'rejected' as const, error }),
      )

      await vi.advanceTimersByTimeAsync(5000)
      const settled = await outcome
      expect(settled.status).toBe('rejected')
      if (settled.status !== 'rejected') {
        throw new Error('Expected stalled worker step to reject')
      }
      expect(settled.error).toBeInstanceOf(Error)
      expect((settled.error as Error).message).toMatch(/timeout/i)
    } finally {
      stepper.terminate()
      vi.useRealTimers()
    }
  })

  it('falls back to a generic worker error when ErrorEvent.message is malformed', async () => {
    const worker = new FakeWorker()
    const stepper = createWorkerSimulationStepper(worker)

    try {
      const pending = stepper.step(createValidStepPayload())
      const outcome = pending.then(
        () => ({ status: 'resolved' as const }),
        (error) => ({ status: 'rejected' as const, error }),
      )

      worker.emitError({ message: 42 as unknown as string })

      const settled = await outcome
      expect(settled.status).toBe('rejected')
      if (settled.status !== 'rejected') {
        throw new Error('Expected worker error to reject the request')
      }
      expect((settled.error as Error).message).toBe('Simulation worker error')
    } finally {
      stepper.terminate()
    }
  })

  it('ignores malformed step-result payloads and keeps waiting for a valid reply', async () => {
    vi.useFakeTimers()
    const worker = new FakeWorker()
    const stepper = createWorkerSimulationStepper(worker)

    try {
      const pending = stepper.step(createValidStepPayload())
      const outcome = pending.then(
        () => ({ status: 'resolved' as const }),
        (error) => ({ status: 'rejected' as const, error }),
      )

      worker.emitMessage({
        type: 'step-result',
        requestId: 'req-1',
        payload: {},
      })

      await vi.advanceTimersByTimeAsync(5000)
      const settled = await outcome
      expect(settled.status).toBe('rejected')
      if (settled.status !== 'rejected') {
        throw new Error('Expected malformed worker result to be ignored until timeout')
      }
      expect((settled.error as Error).message).toMatch(/timeout/i)
    } finally {
      stepper.terminate()
      vi.useRealTimers()
    }
  })

  it('ignores malformed error payloads and keeps waiting for a valid reply', async () => {
    vi.useFakeTimers()
    const worker = new FakeWorker()
    const stepper = createWorkerSimulationStepper(worker)

    try {
      const pending = stepper.step(createValidStepPayload())
      const outcome = pending.then(
        () => ({ status: 'resolved' as const }),
        (error) => ({ status: 'rejected' as const, error }),
      )

      worker.emitMessage({
        type: 'error',
        requestId: 'req-1',
        payload: {},
      })

      await vi.advanceTimersByTimeAsync(5000)
      const settled = await outcome
      expect(settled.status).toBe('rejected')
      if (settled.status !== 'rejected') {
        throw new Error('Expected malformed worker error to be ignored until timeout')
      }
      expect((settled.error as Error).message).toMatch(/timeout/i)
    } finally {
      stepper.terminate()
      vi.useRealTimers()
    }
  })
})
