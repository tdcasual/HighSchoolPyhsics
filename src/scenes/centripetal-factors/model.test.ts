import { describe, expect, it } from 'vitest'
import { buildCentripetalTrace, deriveCentripetalReadings } from './model'

const base = { preset: 'mass' as const, beltRatio: '1:1' as const, leftMassMultiple: 1 as const, leftRadiusMultiple: 2 as const, rightMassMultiple: 1 as const, omegaBase: 1 }

describe('centripetal-factors model', () => {
  it('computes F=mω²r and the reference ratio', () => {
    const readings = deriveCentripetalReadings(base)
    expect(readings.leftFactor).toBeCloseTo(2, 6)
    expect(readings.rightFactor).toBeCloseTo(1, 6)
    expect(readings.forceRatio).toBeCloseTo(2, 6)
  })

  it('applies belt transmission ratios to angular speed', () => {
    const readings = deriveCentripetalReadings({ ...base, beltRatio: '1:2' })
    expect(readings.leftOmega).toBeCloseTo(1, 6)
    expect(readings.rightOmega).toBeCloseTo(2, 6)
    expect(readings.rightFactor).toBeCloseTo(4, 6)
  })

  it('builds a finite control-variable trace', () => {
    const trace = buildCentripetalTrace({ ...base, preset: 'angular' }, 31)
    expect(trace).toHaveLength(31)
    expect(trace.every(([x, left, right]) => Number.isFinite(x) && Number.isFinite(left) && Number.isFinite(right))).toBe(true)
  })
})
