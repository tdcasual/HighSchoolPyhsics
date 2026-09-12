import { describe, expect, it } from 'vitest'
import { buildEmfTrace, deriveFaradayDiscReadings } from './model'

describe('faraday-disc model', () => {
  const params = { B: 1, omega: 10, radius: 0.2, externalResistance: 2, rotation: 'cw' as const, magnetic: 'into' as const, circuit: 'closed' as const }

  it('computes the rotating-disc emf E=1/2 B omega R^2', () => {
    const readings = deriveFaradayDiscReadings(params)
    expect(readings.emf).toBeCloseTo(0.2)
    expect(readings.current).toBeCloseTo(0.2 / 2.05)
    expect(readings.polarity).toBe('A−/B+')
  })

  it('reverses polarity with rotation or magnetic direction and opens the circuit', () => {
    expect(deriveFaradayDiscReadings({ ...params, rotation: 'ccw' }).emf).toBeCloseTo(-0.2)
    expect(deriveFaradayDiscReadings({ ...params, magnetic: 'out' }).emf).toBeCloseTo(-0.2)
    expect(deriveFaradayDiscReadings({ ...params, circuit: 'open' }).current).toBe(0)
  })

  it('builds a finite emf-speed chart trace', () => {
    const trace = buildEmfTrace(params, 33)
    expect(trace).toHaveLength(33)
    expect(trace.every(([omega, emf]) => Number.isFinite(omega) && Number.isFinite(emf))).toBe(true)
  })
})
