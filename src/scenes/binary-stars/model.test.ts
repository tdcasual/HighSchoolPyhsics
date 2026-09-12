import { describe, expect, it } from 'vitest'
import { buildBinaryStarsTrace, deriveBinaryStarsReadings } from './model'

describe('binary-stars model', () => {
  it('splits the separation around the center of mass', () => {
    const readings = deriveBinaryStarsReadings({ mass1: 4, mass2: 2, separation: 30 })
    expect(readings.radius1).toBeCloseTo(10, 6)
    expect(readings.radius2).toBeCloseTo(20, 6)
    expect(readings.radiusRatio).toBeCloseTo(0.5, 6)
  })

  it('keeps the two gravitational forces and angular velocity finite', () => {
    const readings = deriveBinaryStarsReadings({ mass1: 1, mass2: 4, separation: 24 })
    expect(readings.force).toBeGreaterThan(0)
    expect(readings.omega).toBeGreaterThan(0)
    expect(readings.period).toBeGreaterThan(0)
  })

  it('builds a finite radius comparison trace', () => {
    const trace = buildBinaryStarsTrace({ mass1: 4, mass2: 2, separation: 30 }, 31)
    expect(trace).toHaveLength(31)
    expect(trace.every(([mass, r1, r2]) => Number.isFinite(mass) && Number.isFinite(r1) && Number.isFinite(r2))).toBe(true)
  })
})
