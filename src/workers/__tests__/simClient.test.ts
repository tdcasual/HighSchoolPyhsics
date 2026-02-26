import { describe, expect, it } from 'vitest'
import { createLocalSimulationStepper } from '../simClient'

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
