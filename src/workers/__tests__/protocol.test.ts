import { describe, expect, it } from 'vitest'
import { assertValidStepPayload } from '../protocol'

describe('worker step payload validation', () => {
  it('accepts finite positive dt and finite vectors', () => {
    expect(() =>
      assertValidStepPayload({
        state: {
          position: { x: 0, y: 0, z: 0 },
          velocity: { x: 1, y: 0, z: 0 },
        },
        acceleration: { x: 0, y: 1, z: 0 },
        dt: 0.01,
      }),
    ).not.toThrow()
  })

  it('rejects non-positive dt', () => {
    expect(() =>
      assertValidStepPayload({
        state: {
          position: { x: 0, y: 0, z: 0 },
          velocity: { x: 1, y: 0, z: 0 },
        },
        acceleration: { x: 0, y: 1, z: 0 },
        dt: 0,
      }),
    ).toThrow('dt must be finite and > 0')
  })
})
