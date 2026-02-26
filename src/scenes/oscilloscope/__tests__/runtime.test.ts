import { describe, expect, it } from 'vitest'
import {
  computeOscilloscopeAcceleration,
  deriveSweepDeflection,
  deriveTimeCursor,
  deriveVerticalDeflection,
} from '../runtime'

describe('oscilloscope runtime helpers', () => {
  it('uses zero acceleration for time cursor stepping', () => {
    const acc = computeOscilloscopeAcceleration()
    expect(acc).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('derives time cursor from state position.x', () => {
    const time = deriveTimeCursor({
      position: { x: 0.125, y: 0, z: 0 },
      velocity: { x: 1, y: 0, z: 0 },
    })

    expect(time).toBeCloseTo(0.125)
  })

  it('maps time to periodic horizontal sweep in [-1, 1]', () => {
    expect(deriveSweepDeflection(0, 2)).toBeCloseTo(-1)
    expect(deriveSweepDeflection(0.125, 2)).toBeCloseTo(-0.5)
    expect(deriveSweepDeflection(0.5, 2)).toBeCloseTo(-1)
  })

  it('maps signal voltage into clipped vertical deflection', () => {
    expect(deriveVerticalDeflection(3, 6)).toBeCloseTo(0.5)
    expect(deriveVerticalDeflection(-9, 6)).toBeCloseTo(-1)
    expect(deriveVerticalDeflection(2, 0)).toBe(0)
  })
})
