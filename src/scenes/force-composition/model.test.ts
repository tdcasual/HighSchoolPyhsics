import { describe, expect, it } from 'vitest'
import { buildRangeSweep, deriveForceReadings, magnitude, snapVector } from './model'

describe('force-composition model', () => {
  it('computes vector sum and included angle', () => {
    const readings = deriveForceReadings({ mode: 'synthesis', f1: { x: 3, y: 0 }, f2: { x: 0, y: 4 }, rangeF1: 40, rangeF2: 30, rangeAngleDeg: 60, orthogonalMagnitude: 50, orthogonalAngleDeg: 36.87, gravity: 40, slopeAngleDeg: 30 })
    expect(readings.sumMagnitude).toBeCloseTo(5)
    expect(readings.angleDeg).toBeCloseTo(90)
    expect(readings.rangeCurrent).toBeCloseTo(Math.sqrt(40 ** 2 + 30 ** 2 + 2 * 40 * 30 * 0.5))
  })

  it('computes orthogonal and slope decomposition', () => {
    const readings = deriveForceReadings({ mode: 'effect', f1: { x: 1, y: 0 }, f2: { x: 0, y: 1 }, rangeF1: 40, rangeF2: 30, rangeAngleDeg: 60, orthogonalMagnitude: 50, orthogonalAngleDeg: 36.87, gravity: 40, slopeAngleDeg: 30 })
    expect(readings.fx).toBeCloseTo(40)
    expect(readings.fy).toBeCloseTo(30, 0)
    expect(readings.downSlope).toBeCloseTo(20)
    expect(readings.normal).toBeCloseTo(34.64, 1)
  })

  it('snaps vector length to integer units and creates a normalized sweep', () => {
    expect(magnitude(snapVector({ x: 2.2, y: 1.1 }))).toBeCloseTo(2)
    const sweep = buildRangeSweep(5)
    expect(sweep).toHaveLength(5)
    expect(sweep[0]).toEqual([0, 1])
    expect(sweep.at(-1)?.[0]).toBe(180)
  })
})
