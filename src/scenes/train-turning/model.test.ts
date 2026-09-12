import { describe, expect, it } from 'vitest'
import { buildForceTrace, deriveTrainReadings } from './model'

describe('train-turning model', () => {
  it('computes the ideal speed from radius and banking angle', () => {
    const readings = deriveTrainReadings({ speed: 15.1, angleDeg: 16, radius: 80 })
    expect(readings.idealSpeed).toBeCloseTo(14.99, 2)
    expect(readings.status).toBe('ideal')
    expect(Math.abs(readings.sideForce)).toBeLessThan(150)
  })

  it('changes side-force direction around the ideal speed', () => {
    const low = deriveTrainReadings({ speed: 10, angleDeg: 16, radius: 80 })
    const high = deriveTrainReadings({ speed: 25, angleDeg: 16, radius: 80 })
    expect(low.sideForce).toBeLessThan(0)
    expect(high.sideForce).toBeGreaterThan(0)
    expect(low.status).toBe('low')
    expect(high.status).toBe('high')
  })

  it('builds a finite force trace for the chart', () => {
    const trace = buildForceTrace({ speed: 29.5, angleDeg: 16, radius: 80 }, 33)
    expect(trace).toHaveLength(33)
    expect(trace.every(([speed, side, normal]) => Number.isFinite(speed) && Number.isFinite(side) && Number.isFinite(normal))).toBe(true)
  })
})
