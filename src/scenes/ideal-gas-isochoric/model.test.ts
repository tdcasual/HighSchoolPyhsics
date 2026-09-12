import { describe, expect, it } from 'vitest'
import { buildIsochoricTrace, deriveIdealGasReadings, IDEAL_GAS_CONSTANTS } from './model'

describe('ideal-gas-isochoric model', () => {
  it('keeps volume fixed and follows Charles law p proportional to T', () => {
    const first = deriveIdealGasReadings({ temperatureK: 220, volumeL: 6, volumePreset: 'large' })
    const second = deriveIdealGasReadings({ temperatureK: 440, volumeL: 6, volumePreset: 'large' })
    expect(first.pressureAtm).toBeCloseTo(0.7)
    expect(second.pressureAtm / first.pressureAtm).toBeCloseTo(2)
    expect(first.lockedVolume).toBe(true)
  })

  it('changes slope inversely with fixed volume and reports absolute zero', () => {
    const small = deriveIdealGasReadings({ temperatureK: 220, volumeL: 2, volumePreset: 'small' })
    const large = deriveIdealGasReadings({ temperatureK: 220, volumeL: 6, volumePreset: 'large' })
    expect(small.pressureAtm / large.pressureAtm).toBeCloseTo(3)
    expect(large.celsius).toBeCloseTo(-53.15)
    expect(large.absoluteZeroC).toBe(IDEAL_GAS_CONSTANTS.absoluteZeroC)
  })

  it('builds finite p-T and p-t traces', () => {
    const kelvin = buildIsochoricTrace(6, 'kelvin', 33)
    const celsius = buildIsochoricTrace(6, 'celsius', 33)
    expect(kelvin).toHaveLength(33)
    expect(celsius).toHaveLength(33)
    expect([...kelvin, ...celsius].every(([x, p]) => Number.isFinite(x) && Number.isFinite(p))).toBe(true)
    expect(celsius[0][1]).toBe(0)
  })
})
