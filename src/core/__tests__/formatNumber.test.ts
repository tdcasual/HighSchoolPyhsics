import { describe, expect, it } from 'vitest'
import { formatScientific } from '../formatNumber'

describe('formatScientific', () => {
  it('writes large and small magnitudes as ×10ⁿ', () => {
    expect(formatScientific(5.972e24, 4)).toBe('5.972×10²⁴')
    expect(formatScientific(4.81e-19)).toBe('4.81×10⁻¹⁹')
    expect(formatScientific(-1.4e-17)).toBe('-1.40×10⁻¹⁷')
  })

  it('keeps everyday magnitudes as plain decimals with the same significant figures', () => {
    expect(formatScientific(3.6)).toBe('3.60')
    expect(formatScientific(0.0125)).toBe('0.0125')
    expect(formatScientific(1076e-6, 4)).toBe('1.076×10⁻³')
    expect(formatScientific(0)).toBe('0.00')
  })
})
