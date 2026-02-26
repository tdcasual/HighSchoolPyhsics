import { describe, expect, it, vi } from 'vitest'
import { createLocalSimulationStepper, createWorkerSimulationStepper } from '../simClient'

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
}

describe('local simulation stepper', () => {
  it('returns next state asynchronously', async () => {
    const stepper = createLocalSimulationStepper()

    const next = await stepper.step({
      state: {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 1, y: 0, z: 0 },
      },
      acceleration: { x: 1, y: 0, z: 0 },
      dt: 1,
    })

    expect(next.velocity.x).toBeCloseTo(2)
    expect(next.position.x).toBeCloseTo(2)
    stepper.terminate()
  })
})

describe('worker simulation stepper', () => {
  it('rejects stalled requests after timeout', async () => {
    vi.useFakeTimers()
    const worker = new FakeWorker()
    const stepper = createWorkerSimulationStepper(worker)

    try {
      const pending = stepper.step({
        state: {
          position: { x: 0, y: 0, z: 0 },
          velocity: { x: 1, y: 0, z: 0 },
        },
        acceleration: { x: 0, y: 0, z: 0 },
        dt: 1,
      })
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
})
