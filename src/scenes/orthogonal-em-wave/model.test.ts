import { describe, expect, it } from 'vitest'
import { buildFieldTrace, deriveEmWaveReadings, phaseAt } from './model'

describe('orthogonal-em-wave model', () => {
  const params = { amplitude: 1, wavelength: 4, speed: 4, direction: 'right' as const }

  it('derives v = lambda f and keeps E cross B aligned with propagation', () => {
    const readings = deriveEmWaveReadings(0, params)
    expect(readings.frequency).toBeCloseTo(1)
    expect(readings.waveNumber).toBeCloseTo(Math.PI / 2)
    // E and B in phase for a right-going wave, opposite in sign for a left-going one.
    for (const [, e, b] of buildFieldTrace(0.25, params, 9)) expect(e).toBeCloseTo(b)
    for (const [, e, b] of buildFieldTrace(0.25, { ...params, direction: 'left' as const }, 9)) expect(b).toBeCloseTo(-e)
    expect(readings.orthogonality).toBe(0)
  })

  it('reverses the spatial phase when propagation direction changes', () => {
    const right = phaseAt(1, 0, params)
    const left = phaseAt(1, 0, { ...params, direction: 'left' })
    expect(right).toBeCloseTo(-left)
    const rightFlux = deriveEmWaveReadings(0.25, params).samples[0].e * deriveEmWaveReadings(0.25, params).samples[0].b
    const leftParams = { ...params, direction: 'left' as const }
    const leftReadings = deriveEmWaveReadings(0.25, leftParams)
    const leftFlux = leftReadings.samples[0].e * leftReadings.samples[0].b
    expect(rightFlux).toBeGreaterThan(0)
    expect(leftFlux).toBeLessThan(0)
  })

  it('builds a finite spatial trace with both field components', () => {
    const trace = buildFieldTrace(0.3, params, 33)
    expect(trace).toHaveLength(33)
    expect(trace.every(([x, e, b]) => Number.isFinite(x) && Number.isFinite(e) && Number.isFinite(b))).toBe(true)
  })
})
