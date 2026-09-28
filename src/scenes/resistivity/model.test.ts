import { describe, expect, it } from 'vitest'
import { element, fitOrigin, measurement, systematicError, wire, wireResistance } from './model'

describe('resistivity model', () => {
  it('offsets one wire into three diameters whose mean is the nominal value', () => {
    const sample = wire('nichrome', 0.4)
    expect(sample.positions).toEqual([0.404, 0.394, 0.402])
    expect(sample.diameter).toBeCloseTo(0.4, 8)
    expect(wireResistance(sample.rho, 0.5, sample.diameter)).toBeCloseTo(
      1e-6 * 0.5 / (Math.PI * (0.4e-3) ** 2 / 4),
      6,
    )
  })

  it('reads a closed external circuit below the true resistance', () => {
    const reading = measurement({
      material: 'nichrome',
      diameter: 0.4,
      length: 0.5,
      control: 'limit',
      method: 'external',
      slider: 1,
      closed: true,
    })
    expect(reading.closed).toBe(true)
    expect(reading.Imeter).toBeGreaterThan(0)
    expect(reading.Umeter).toBeGreaterThan(0)
    expect(reading.Rmeasured).toBeLessThan(reading.Rtrue)
  })

  it('models the internal connection and the divider endpoints with the correct polarity', () => {
    const input = {
      material: 'nichrome' as const,
      diameter: 0.4,
      length: 0.5,
      ammeter: 'A06' as const,
      voltmeter: 'V3' as const,
      method: 'internal' as const,
      closed: true,
    }
    const internal = measurement({ ...input, control: 'limit', slider: 0.5 })
    expect(internal.Rmeasured).toBeCloseTo(internal.Rtrue + 0.125, 6)
    const zero = measurement({ ...input, method: 'external', control: 'divider', slider: 0 })
    const half = measurement({ ...input, method: 'external', control: 'divider', slider: 0.5 })
    const full = measurement({ ...input, method: 'external', control: 'divider', slider: 1 })
    expect(zero.Ux).toBeCloseTo(0, 6)
    expect(half.Ux).toBeGreaterThan(zero.Ux)
    expect(full.Ux).toBeGreaterThan(half.Ux)
  })

  it('recommends the external connection for a few-ohm wire', () => {
    const error = systematicError(4, 'external', 'A06', 'V3')
    expect(error.recommend).toBe('external')
    expect(error.measured).toBeLessThan(4)
    expect(error.critical).toBeCloseTo(Math.sqrt(0.125 * 3000), 8)
  })

  it('fits a line through the origin and rates the lamp near its marked current', () => {
    expect(fitOrigin([[1, 2], [2, 4]])?.slope).toBeCloseTo(2, 8)
    expect(element('lamp', 0).I).toBe(0)
    expect(element('lamp', 2.5).I).toBeGreaterThan(0.2)
    expect(element('lamp', 2.5).I).toBeLessThan(0.45)
    expect(element('diode', 0.7).I).toBeGreaterThan(element('diode', 0.2).I)
    expect(Math.abs(element('diode', -1).I)).toBeLessThan(1e-6)
  })
})
