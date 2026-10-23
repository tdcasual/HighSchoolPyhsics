import { describe, expect, it } from 'vitest'
import { buildTimeSeries, deriveAdaptiveWindowS, evaluateGapVoltageAtTime, evaluateKineticEnergyAtTime } from './trace'

describe('cyclotron trace helpers', () => {
  it('adapts chart window from cyclotron period', () => {
    const periodS = 2.2e-8
    expect(deriveAdaptiveWindowS(periodS)).toBeCloseTo(periodS * 4)
  })

  it('models a sinusoidal RF voltage synchronized to the cyclotron period', () => {
    const periodS = 2e-8
    const amplitudeV = 120

    expect(evaluateGapVoltageAtTime(0, amplitudeV, periodS)).toBeCloseTo(amplitudeV, 6)
    expect(evaluateGapVoltageAtTime(periodS / 4, amplitudeV, periodS)).toBeCloseTo(0, 6)
    expect(evaluateGapVoltageAtTime(periodS / 2, amplitudeV, periodS)).toBeCloseTo(-amplitudeV, 6)
    expect(evaluateGapVoltageAtTime(periodS, amplitudeV, periodS)).toBeCloseTo(amplitudeV, 6)
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
