import { describe, expect, it } from 'vitest'
import { buildPhaseTrace, deriveGeneratorReadings, emfToPlotPoint, phaseToPlotPoint } from './model'

describe('generator-core model', () => {
  it('derives the neutral, parallel and transition positions', () => {
    const neutral = deriveGeneratorReadings(0)
    expect(neutral.position).toBe('neutral')
    expect(neutral.fluxNormalized).toBeCloseTo(1)
    expect(neutral.emfNormalized).toBeCloseTo(0)
    expect(neutral.cuttingLabel).toContain('不切割')

    const parallel = deriveGeneratorReadings(Math.PI / 2)
    expect(parallel.position).toBe('parallel')
    expect(parallel.fluxNormalized).toBeCloseTo(0)
    expect(parallel.emfNormalized).toBeCloseTo(1)
    expect(parallel.currentDirection).toBe('正向')

    const transition = deriveGeneratorReadings(Math.PI / 4)
    expect(transition.position).toBe('transition')
    expect(transition.normalVector[0]).toBeCloseTo(Math.SQRT1_2)
  })

  it('keeps phase curves in one normalized cycle and tracks the same angle', () => {
    const trace = buildPhaseTrace(9)
    expect(trace.flux).toHaveLength(9)
    expect(trace.emf).toHaveLength(9)
    expect(trace.flux[0][1]).toBeCloseTo(1)
    expect(trace.flux[2][1]).toBeCloseTo(0)
    expect(trace.emf[2][1]).toBeCloseTo(1)
    expect(trace.flux.at(-1)?.[1]).toBeCloseTo(1)
    expect(phaseToPlotPoint(Math.PI)[0]).toBeCloseTo(0)
    expect(emfToPlotPoint(Math.PI / 2)[1]).toBeCloseTo(1)
  })
})

