import { describe, expect, it } from 'vitest'
import { needleRotation } from './pose'
import {
  connectConversion,
  createMultimeterState,
  displayFraction,
  isMechanicallyZero,
  isOhmZero,
  readingOf,
  zeroMechanical,
  zeroOhm,
} from './state'

describe('multimeter acceptance', () => {
  it('deflects the 2.5 V needle for a dry cell and returns it with mechanical zero', () => {
    const initial = createMultimeterState()
    const fraction = displayFraction(initial)
    expect(fraction).toBeGreaterThan(0.55)
    expect(fraction).toBeLessThan(0.7)
    expect(needleRotation(fraction)).toBeLessThan(0)
    const zeroed = zeroMechanical({ ...initial, range: 'OFF', task: 'Z' })
    expect(isMechanicallyZero(zeroed)).toBe(true)
    expect(Math.abs(readingOf(zeroed).fraction)).toBeLessThan(0.003)
  })

  it('connects the calculated series resistor and reaches full scale at the calibration voltage', () => {
    const connected = connectConversion({ ...createMultimeterState(), stage: 'convert', convTest: 1 })
    expect(connected.convResistance).toBeCloseTo(2970, 6)
    expect(displayFraction(connected)).toBeCloseTo(1, 6)
  })

  it('zeros the ohm range only after the probes are shorted on an ohm stop', () => {
    const ohm = { ...createMultimeterState(), range: 'R10' as const, task: 'Z' as const, mechanicalOffset: 0, mechanical: 0 }
    expect(isOhmZero(ohm)).toBe(false)
    const zeroed = zeroOhm(ohm)
    expect(isOhmZero(zeroed)).toBe(true)
    expect(readingOf(zeroed).fraction).toBeCloseTo(1, 3)
  })
})
