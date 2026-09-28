import { describe, expect, it } from 'vitest'
import { buildFieldTrace, deriveEmWaveReadings, electricFieldAt, magneticFieldAt, phaseAt } from './model'

describe('orthogonal-em-wave model', () => {
  const params = { amplitude: 1, wavelength: 4, speed: 4, direction: 'right' as const }

  it('derives v = lambda f and keeps E cross B aligned with propagation', () => {
    const readings = deriveEmWaveReadings(0, params)
    expect(readings.frequency).toBeCloseTo(1)
    expect(readings.waveNumber).toBeCloseTo(Math.PI / 2)
    expect(electricFieldAt(1, 0.25, params)).toBeCloseTo(magneticFieldAt(1, 0.25, params))
    const leftParams = { ...params, direction: 'left' as const }
    const leftElectric = electricFieldAt(0, 0.25, leftParams)
    expect(leftElectric).toBeCloseTo(1)
    expect(magneticFieldAt(0, 0.25, leftParams)).toBeCloseTo(-leftElectric)
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
