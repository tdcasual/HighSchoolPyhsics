import { describe, expect, it } from 'vitest'
import {
  bestOhmRange,
  galvanometerCurrent,
  measure,
  ohmFraction,
  rheostat,
  seriesResistor,
  shuntResistor,
  meterResistance,
  RANGE,
  trialContact,
  voltAmmeter,
} from './model'

describe('multimeter model', () => {
  it('sizes the series and shunt resistors so the galvanometer reaches full scale', () => {
    expect(seriesResistor(3)).toBeCloseTo(2970, 8)
    expect(shuntResistor(0.6)).toBeCloseTo(0.03 / 0.599, 8)
    expect(galvanometerCurrent('V', 3, 2970)).toBeCloseTo(0.001, 8)
  })

  it('makes the external reading low and the internal reading high', () => {
    const result = voltAmmeter({ Rx: 20, RA: 1, RV: 3000, E: 3, Rs: 10 })
    expect(result.external.R).toBeLessThan(20)
    expect(result.internal.R).toBeGreaterThan(20)
    expect(result.internal.R).toBeCloseTo(21, 8)
    expect(result.internal.I).toBeLessThan(3 / (10 + 1 + 20))
    expect(result.critical).toBeCloseTo(Math.sqrt(3000), 8)
    expect(trialContact({ Rx: 20, RA: 1, RV: 3000, E: 3, Rs: 10 }).choose).toBe(result.better)
  })

  it('starts the divider at zero and keeps the limiter above zero', () => {
    const parked = rheostat({ E: 3, r: 0.5, R0: 50, Rx: 20, s: 0 })
    expect(parked.divider.U).toBeCloseTo(0, 8)
    expect(parked.limit.U).toBeGreaterThan(0)
    expect(parked.dividerRange[0]).toBe(0)
    expect(parked.limitRange[0]).toBeLessThan(parked.limitRange[1])
  })

  it('puts the ohm mid-scale at the internal resistance and loads a dry cell on the 2.5 V range', () => {
    expect(ohmFraction(15, 1)).toBeCloseTo(0.5, 8)
    const cell = measure({ range: 'V2.5', target: 'cell' })
    expect(cell.truth).toBeCloseTo((1.5 * 50000) / 50000.6, 4)
    expect(cell.fraction).toBeCloseTo((cell.truth ?? 0) / 2.5, 6)
    const offsetCell = measure({ range: 'V2.5', target: 'cell', mechanical: 0.028 })
    expect(offsetCell.indicated).toBeCloseTo(1.57, 2)
    expect(offsetCell.truth).toBeCloseTo(1.5, 2)
    const reverseCell = measure({ range: 'V2.5', target: 'cell', swapped: true, mechanical: 0 })
    expect(reverseCell.indicated).toBeLessThan(0)
    expect(measure({ range: 'mA10', target: 'cell' }).damage).toBe(true)
    expect(bestOhmRange(150)).toBe('R10')
    expect(meterResistance(RANGE.mA10)).toBeCloseTo(3, 6)
    expect(meterResistance(RANGE.mA100)).toBeCloseTo(0.3, 6)
  })
})
