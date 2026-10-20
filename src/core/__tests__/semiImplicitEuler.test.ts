import { describe, expect, it } from 'vitest'
import { semiImplicitEulerStep } from '../integrators/semiImplicitEuler'

describe('semiImplicitEulerStep', () => {
  it('updates velocity first, then position', () => {
    const result = semiImplicitEulerStep(
      {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 1, y: 0, z: 0 },
      },
      { x: 2, y: 0, z: 0 },
      0.5,
    )

    expect(result.velocity.x).toBeCloseTo(2)
    expect(result.position.x).toBeCloseTo(1)
  })
})

