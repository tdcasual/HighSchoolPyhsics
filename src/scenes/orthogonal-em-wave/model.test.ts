import { describe, expect, it } from 'vitest'
import { buildFieldTrace, deriveEmWaveReadings, electricFieldAt, magneticFieldAt, phaseAt } from './model'

describe('orthogonal-em-wave model', () => {
  const params = { amplitude: 1, wavelength: 4, speed: 4, direction: 'right' as const }

  it('derives the wave relation v = lambda f and synchronized E/B fields', () => {
    const readings = deriveEmWaveReadings(0, params)
    expect(readings.frequency).toBeCloseTo(1)
    expect(readings.waveNumber).toBeCloseTo(Math.PI / 2)
    expect(electricFieldAt(1, 0.25, params)).toBeCloseTo(magneticFieldAt(1, 0.25, params))
    expect(readings.orthogonality).toBe(0)
  })

  it('reverses the spatial phase when propagation direction changes', () => {
    const right = phaseAt(1, 0, params)
    const left = phaseAt(1, 0, { ...params, direction: 'left' })
    expect(right).toBeCloseTo(-left)
  })

  it('builds a finite spatial trace with both field components', () => {
    const trace = buildFieldTrace(0.3, params, 33)
    expect(trace).toHaveLength(33)
    expect(trace.every(([x, e, b]) => Number.isFinite(x) && Number.isFinite(e) && Number.isFinite(b))).toBe(true)
  })
})
