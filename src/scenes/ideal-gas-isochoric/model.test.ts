import { describe, expect, it } from 'vitest'
import {
  buildIsochoricTrace,
  buildIsochoricTraceSegment,
  chamberGasHeightForVolumeL,
  deriveIdealGasReadings,
  IDEAL_GAS_CONSTANTS,
  ISOCHORIC_TEMPERATURE_RANGE,
} from './model'

describe('ideal-gas-isochoric model', () => {
  it('follows the ideal gas law with fixed amount and fixed volume', () => {
    const first = deriveIdealGasReadings({ temperatureK: 220, volumeL: 6, volumePreset: 'large' })
    const second = deriveIdealGasReadings({ temperatureK: 440, volumeL: 6, volumePreset: 'large' })
    expect(first.pressureAtm).toBeCloseTo(0.7)
    expect(second.pressureAtm / first.pressureAtm).toBeCloseTo(2)
    expect(first.gasAmountMol).toBeCloseTo(IDEAL_GAS_CONSTANTS.amountMol)
    expect(first.lockedVolume).toBe(true)
  })

  it('changes pressure slope and particle number density inversely with volume', () => {
    const small = deriveIdealGasReadings({ temperatureK: 220, volumeL: 2, volumePreset: 'small' })
    const large = deriveIdealGasReadings({ temperatureK: 220, volumeL: 6, volumePreset: 'large' })
    expect(small.pressureAtm / large.pressureAtm).toBeCloseTo(3)
    expect(small.slopeAtmPerK / large.slopeAtmPerK).toBeCloseTo(3)
    expect(small.densityRelative / large.densityRelative).toBeCloseTo(3)
    expect(large.celsius).toBeCloseTo(-53.15)
    expect(large.absoluteZeroC).toBe(IDEAL_GAS_CONSTANTS.absoluteZeroC)
  })

  it('maps the locked piston height linearly to volume', () => {
    expect(chamberGasHeightForVolumeL(6) / chamberGasHeightForVolumeL(2)).toBeCloseTo(3)
    expect(chamberGasHeightForVolumeL(3) / chamberGasHeightForVolumeL(2)).toBeCloseTo(1.5)
  })

  it('builds finite traces without temperatures below absolute zero', () => {
    const kelvin = buildIsochoricTrace(6, 'kelvin', 33)
    const celsius = buildIsochoricTrace(6, 'celsius', 33)
    const belowMeasured = buildIsochoricTraceSegment(6, 'kelvin', 0, ISOCHORIC_TEMPERATURE_RANGE.minK, 17)
    expect(kelvin).toHaveLength(33)
    expect(celsius).toHaveLength(33)
    expect([...kelvin, ...celsius, ...belowMeasured].every(([x, p]) => Number.isFinite(x) && Number.isFinite(p))).toBe(true)
    expect(celsius[0]).toEqual([IDEAL_GAS_CONSTANTS.absoluteZeroC, 0])
    expect(celsius.at(-1)?.[0]).toBeCloseTo(ISOCHORIC_TEMPERATURE_RANGE.maxK + IDEAL_GAS_CONSTANTS.absoluteZeroC)
    expect(belowMeasured.every(([temperatureK]) => temperatureK >= 0 && temperatureK <= ISOCHORIC_TEMPERATURE_RANGE.minK)).toBe(true)
  })
})
