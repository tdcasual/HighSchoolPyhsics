import { describe, expect, it } from 'vitest'
import {
  computeFringeSpacing,
  computeWedgeIntensity,
  computeFringeCount,
  formatFringeSpacing,
  DEFAULT_PARAMS,
} from '../model'

describe('computeFringeSpacing', () => {
  it('returns correct spacing for typical values', () => {
    // λ = 550nm, θ = 0.1°
    const spacing = computeFringeSpacing(550, 0.1)
    // l = λ/(2sinθ) = 550e-3 μm / (2 × sin(0.1°)) = 0.55 / (2 × 0.001745) ≈ 157.5 μm
    expect(spacing).toBeCloseTo(157.57, 0)
  })

  it('increases spacing for smaller angles', () => {
    const s1 = computeFringeSpacing(550, 0.1)
    const s2 = computeFringeSpacing(550, 0.01)
    expect(s2).toBeGreaterThan(s1)
  })

  it('decreases spacing for shorter wavelengths', () => {
    const sRed = computeFringeSpacing(700, 0.1)
    const sBlue = computeFringeSpacing(400, 0.1)
    expect(sBlue).toBeLessThan(sRed)
  })
})

describe('computeWedgeIntensity', () => {
  it('returns 0 at d = 0 (contact edge, dark fringe)', () => {
    const I = computeWedgeIntensity(550, 0)
    expect(I).toBeCloseTo(0, 10)
  })

  it('returns 1 at d = λ/4 (first bright fringe)', () => {
    // d = λ/4 in μm: 550nm/4 = 137.5nm = 0.1375μm
    const I = computeWedgeIntensity(550, 550 / 4 * 1e-3)
    expect(I).toBeCloseTo(1, 10)
  })

  it('returns 0 at d = λ/2 (first dark fringe after contact)', () => {
    // d = λ/2 → phase = 2π × (λ/2) / λ = π → sin²(π) = 0
    const I = computeWedgeIntensity(550, 550 / 2)
    expect(I).toBeCloseTo(0, 10)
  })

  it('oscillates between 0 and 1', () => {
    for (let d = 0; d < 50; d += 0.5) {
      const I = computeWedgeIntensity(550, d)
      expect(I).toBeGreaterThanOrEqual(0)
      expect(I).toBeLessThanOrEqual(1)
    }
  })
})

describe('computeFringeCount', () => {
  it('returns positive count for default params', () => {
    const count = computeFringeCount(DEFAULT_PARAMS)
    expect(count).toBeGreaterThan(0)
  })

  it('increases with larger angle', () => {
    const small = computeFringeCount({ ...DEFAULT_PARAMS, wedgeAngle: 0.05 })
    const large = computeFringeCount({ ...DEFAULT_PARAMS, wedgeAngle: 0.2 })
    expect(large).toBeGreaterThan(small)
  })
})

describe('formatFringeSpacing', () => {
  it('formats default spacing in mm or μm', () => {
    const label = formatFringeSpacing(DEFAULT_PARAMS)
    expect(label).toMatch(/μm|mm/)
  })

  it('formats small-angle spacing in mm', () => {
    const label = formatFringeSpacing({ ...DEFAULT_PARAMS, wedgeAngle: 0.01 })
    expect(label).toContain('mm')
  })
})
