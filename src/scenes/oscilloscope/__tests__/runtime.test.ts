import { describe, expect, it } from 'vitest'
import { deriveSweepDeflection, deriveVerticalDeflection } from '../runtime'

describe('oscilloscope runtime helpers', () => {
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
