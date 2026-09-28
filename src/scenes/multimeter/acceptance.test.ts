import { describe, expect, it } from 'vitest'
import { needleRotation } from './pose'
import {
  connectConversion,
  createMultimeterState,
  displayFraction,
  isMechanicallyZero,
  isOhmZero,
  readingOf,
  parkRheostat,
  selectRheostatMode,
  toggleRheostat,
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
    expect(displayFraction(connected)).toBeCloseTo(1.028, 6)
    const zeroed = connectConversion({ ...createMultimeterState(), stage: 'convert', convTest: 1, mechanicalOffset: 0 })
    expect(displayFraction(zeroed)).toBeCloseTo(1, 6)
  })

  it('requires mechanical zero and shorted probes before zeroing the ohm range', () => {
    const unzeroed = { ...createMultimeterState(), range: 'R10' as const, task: 'R' as const, mechanicalOffset: 0.028, mechanical: 0 }
    expect(isOhmZero(zeroOhm(unzeroed))).toBe(false)
    const wrongTask = { ...unzeroed, mechanicalOffset: 0, task: 'R' as const }
    expect(zeroOhm(wrongTask).notice).toContain('短接')
    const shorted = { ...wrongTask, task: 'Z' as const }
    expect(isOhmZero(shorted)).toBe(false)
    const zeroed = zeroOhm(shorted)
    expect(isOhmZero(zeroed)).toBe(true)
    expect(readingOf(zeroed).fraction).toBeCloseTo(1, 3)
    const measured = readingOf({ ...zeroed, task: 'R' as const, resistance: 150 })
    expect(measured.indicated).toBeCloseTo(150, 4)
  })

  it('parks at the safe endpoint and prevents closing either rheostat topology from the wrong endpoint', () => {
    const initial = { ...createMultimeterState(), stage: 'rheostat' as const, rheostatMode: 'limit' as const, slider: 0.3 }
    expect(toggleRheostat(initial).rheostatClosed).toBe(false)
    expect(toggleRheostat(initial).notice).toContain('b 端')
    const limit = selectRheostatMode(initial, 'limit')
    expect(parkRheostat(limit).slider).toBe(1)
    const closedLimit = toggleRheostat(parkRheostat(limit))
    expect(closedLimit.rheostatClosed).toBe(true)
    expect(toggleRheostat(closedLimit).rheostatClosed).toBe(false)
    const divider = selectRheostatMode(initial, 'divider')
    expect(parkRheostat(divider).slider).toBe(0)
    expect(toggleRheostat(parkRheostat(divider)).rheostatClosed).toBe(true)
  })
})
