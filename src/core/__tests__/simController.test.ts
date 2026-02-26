import { describe, expect, it } from 'vitest'
import { semiImplicitEulerStep } from '../integrators/semiImplicitEuler'
import { createSimController } from '../simController'

describe('sim controller', () => {
  it('updates particle state through configured step function', () => {
    const controller = createSimController(semiImplicitEulerStep)

    const next = controller.tick(
      {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 1, y: 0, z: 0 },
      },
      { x: 1, y: 0, z: 0 },
      1,
    )

    expect(next.velocity.x).toBeCloseTo(2)
    expect(next.position.x).toBeCloseTo(2)
  })
})
