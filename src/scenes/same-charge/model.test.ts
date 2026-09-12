import { describe, expect, it } from 'vitest'
import { buildSameChargeContours, buildSameChargeFieldLines, deriveSameChargeReadings } from './model'

const base = { separation: 4, charge: 3, probeX: 0, probeY: 2.8, polarity: 'positive' as const, flow: true, showEquipotential: true, showVectors: true }

describe('same-charge model', () => {
  it('cancels the horizontal field on the perpendicular bisector', () => {
    const readings = deriveSameChargeReadings(base)
    expect(readings.totalField.x).toBeCloseTo(0, 8)
    expect(readings.totalField.y).toBeGreaterThan(0)
    expect(readings.potential).toBeGreaterThan(0)
  })

  it('reverses field and potential for two negative charges', () => {
    const readings = deriveSameChargeReadings({ ...base, polarity: 'negative' })
    expect(readings.totalField.y).toBeLessThan(0)
    expect(readings.potential).toBeLessThan(0)
  })

  it('builds finite contours and field paths', () => {
    const contours = buildSameChargeContours(4, 6)
    const lines = buildSameChargeFieldLines(4, 10)
    expect(contours.length).toBeGreaterThan(10)
    expect(lines).toHaveLength(20)
    expect(lines.flat().every((point) => point.every(Number.isFinite))).toBe(true)
  })
})
