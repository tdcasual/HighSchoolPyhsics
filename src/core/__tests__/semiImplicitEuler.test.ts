import { describe, expect, it } from 'vitest'
import { assertFiniteState } from '../numeric-guards'
import { semiImplicitEulerStep } from '../integrators/semiImplicitEuler'
import type { Vector3Like } from '../types'

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

describe('assertFiniteState', () => {
  it('throws when a component is not finite', () => {
    const bad: Vector3Like = { x: Number.NaN, y: 0, z: 0 }
    expect(() => assertFiniteState({ position: bad, velocity: bad })).toThrow()
  })
})
