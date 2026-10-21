import { describe, expect, it } from 'vitest'
import { deriveVerticalDeflection } from '../runtime'

describe('oscilloscope runtime helpers', () => {
  it('maps signal voltage into clipped vertical deflection', () => {
    expect(deriveVerticalDeflection(3, 6)).toBeCloseTo(0.5)
    expect(deriveVerticalDeflection(-9, 6)).toBeCloseTo(-1)
    expect(deriveVerticalDeflection(2, 0)).toBe(0)
  })
})
