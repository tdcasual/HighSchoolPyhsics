import { describe, expect, it } from 'vitest'
import { at, counts, dots, fit, hangingMass, hookAcceleration, measurements } from './model'

const accelerated = { a: hookAcceleration(3), v0: 0.1, dh: 0 }

describe('cart model', () => {
  it('uses three 10 g hooks on a 500 g cart', () => {
    expect(hookAcceleration(3)).toBeCloseTo(0.294 / 0.53, 12)
    expect(hangingMass(accelerated)).toBeCloseTo(0.03, 12)
    expect(at(1, accelerated)).toMatchObject({
      x: 0.1 + 0.5 * accelerated.a,
      v: 0.1 + accelerated.a,
    })
  })

  it('prints one dot every 0.02 s and keeps the endpoints', () => {
    expect(dots(0.04, accelerated)).toHaveLength(3)
    expect(dots(1.6, accelerated)).toHaveLength(81)
    expect(counts(0.2, accelerated, 5).map((point) => point.label)).toEqual(['A', 'B', 'C'])
    expect(measurements(0.2, accelerated, 5)).toHaveLength(1)
  })

  it('recovers the parallel acceleration from the paper-tape speeds', () => {
    const fitted = fit(measurements(1.6, accelerated, 5))
    expect(fitted?.a).toBeCloseTo(accelerated.a, 10)
    expect(fitted?.v0).toBeCloseTo(0.1, 10)
  })

  it('slows the cart when the string is no longer parallel to the board', () => {
    const flat = at(1.6, accelerated)
    const tilted = at(1.6, { ...accelerated, dh: 0.05 })
    expect(flat.x).toBeCloseTo(0.8700377358490566, 10)
    expect(tilted.x).toBeCloseTo(0.8696568952264557, 8)
    expect(tilted.x).toBeLessThan(flat.x)
  })
})
