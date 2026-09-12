import { describe, expect, it } from 'vitest'
import { buildSpatialWave, buildTemporalWave, deriveMechanicalWaveReadings } from './model'

describe('mechanical-wave-graphs model', () => {
  const params = { amplitude: 6, wavelength: 48, period: 3.5, probeX: 24 }

  it('derives wave speed and probe state', () => {
    const readings = deriveMechanicalWaveReadings(7.1, params)
    expect(readings.speed).toBeCloseTo(48 / 3.5)
    expect(readings.arrivalTime).toBeCloseTo(1.75)
    expect(Number.isFinite(readings.displacement)).toBe(true)
  })

  it('builds spatial and temporal image traces', () => {
    expect(buildSpatialWave(1, params, 33)).toHaveLength(33)
    expect(buildTemporalWave(params, 33)).toHaveLength(33)
    expect(buildTemporalWave(params, 33).every(([time, value]) => Number.isFinite(time) && Number.isFinite(value))).toBe(true)
  })
})
