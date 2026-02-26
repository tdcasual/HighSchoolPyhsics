import { describe, expect, it } from 'vitest'
import {
  buildTimeSeries,
  deriveAdaptiveWindowS,
  evaluateGapVoltageAtTime,
  evaluateKineticEnergyAtTime,
} from './trace'

describe('cyclotron trace helpers', () => {
  it('adapts chart window from cyclotron period', () => {
    const periodS = 2.2e-8
    expect(deriveAdaptiveWindowS(periodS)).toBeCloseTo(periodS * 4)
  })

  it('flips gap voltage sign every half period', () => {
    const periodS = 2e-8
    const amplitudeV = 120

    const firstHalfA = evaluateGapVoltageAtTime(periodS * 0.1, amplitudeV, periodS)
    const firstHalfB = evaluateGapVoltageAtTime(periodS * 0.4, amplitudeV, periodS)
    const secondHalfA = evaluateGapVoltageAtTime(periodS * 0.6, amplitudeV, periodS)
    const secondHalfB = evaluateGapVoltageAtTime(periodS * 0.9, amplitudeV, periodS)
    const beforeFlip = evaluateGapVoltageAtTime(periodS * 0.499, amplitudeV, periodS)
    const afterFlip = evaluateGapVoltageAtTime(periodS * 0.501, amplitudeV, periodS)

    expect(firstHalfA).toBeCloseTo(amplitudeV, 6)
    expect(firstHalfB).toBeCloseTo(amplitudeV, 6)
    expect(secondHalfA).toBeCloseTo(-amplitudeV, 6)
    expect(secondHalfB).toBeCloseTo(-amplitudeV, 6)
    expect(beforeFlip).toBeCloseTo(amplitudeV, 6)
    expect(afterFlip).toBeCloseTo(-amplitudeV, 6)
  })

  it('keeps ignore-time mode as step jump while include-time mode ramps', () => {
    const options = {
      periodS: 2e-8,
      initialEnergyJ: 1,
      deltaEnergyJ: 0.2,
      crossingDurationS: 1e-9,
    } as const

    const earlyIgnore = evaluateKineticEnergyAtTime({
      ...options,
      mode: 'ignore-acceleration-time',
      timeS: 2e-10,
    })
    const earlyInclude = evaluateKineticEnergyAtTime({
      ...options,
      mode: 'include-acceleration-time',
      timeS: 2e-10,
    })
    const lateInclude = evaluateKineticEnergyAtTime({
      ...options,
      mode: 'include-acceleration-time',
      timeS: 1.2e-9,
    })

    expect(earlyIgnore).toBeCloseTo(1.2, 6)
    expect(earlyInclude).toBeGreaterThan(1)
    expect(earlyInclude).toBeLessThan(earlyIgnore)
    expect(lateInclude).toBeCloseTo(1.2, 6)
  })

  it('builds fixed-size time series ending at current time', () => {
    const series = buildTimeSeries({
      endTimeS: 8,
      windowS: 4,
      samples: 5,
      evaluate: (timeS) => timeS * 2,
    })

    expect(series).toHaveLength(5)
    expect(series[0]?.timeS).toBe(4)
    expect(series[4]?.timeS).toBe(8)
    expect(series[2]?.value).toBe(12)
  })
})
