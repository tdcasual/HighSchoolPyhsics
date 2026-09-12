import { describe, expect, it } from 'vitest'
import { buildForceComparison, deriveParallelogramReadings } from './model'

describe('force-parallelogram model', () => {
  it('computes the vector sum for equal diagonal forces', () => {
    const readings = deriveParallelogramReadings({ f1: 1.82, f2: 1.82, angleDeg: 100, step: 'compare' })
    expect(readings.theoreticalMagnitude).toBeCloseTo(2.34, 2)
    expect(readings.sumVector.y).toBeLessThan(0)
  })

  it('reports small comparison errors for the equivalent single force', () => {
    const readings = deriveParallelogramReadings({ f1: 2, f2: 1.5, angleDeg: 80, step: 'compare' })
    expect(readings.magnitudeErrorPercent).toBeLessThan(1)
    expect(readings.angleErrorDeg).toBeCloseTo(0.5, 6)
  })

  it('builds a finite angle comparison trace', () => {
    const trace = buildForceComparison({ f1: 1.8, f2: 1.8, angleDeg: 90, step: 'synthesis' }, 31)
    expect(trace).toHaveLength(31)
    expect(trace.every(([angle, theory, measured]) => Number.isFinite(angle) && Number.isFinite(theory) && Number.isFinite(measured))).toBe(true)
  })
})
