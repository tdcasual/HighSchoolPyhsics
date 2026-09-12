import { describe, expect, it } from 'vitest'
import { buildContourRings, deriveDipoleReadings } from './model'

const base = { separation: 4, charge: 3, probeX: 0, probeY: 1.5, flow: true, showEquipotential: true, showVectors: true }

describe('equipotential-dipole model', () => {
  it('cancels potential on the perpendicular bisector', () => {
    const readings = deriveDipoleReadings(base)
    expect(readings.potential).toBeCloseTo(0, 8)
    expect(readings.positiveMagnitude).toBeCloseTo(readings.negativeMagnitude, 8)
    expect(readings.totalField.x).toBeGreaterThan(0)
  })

  it('adds the two fields along the charge line', () => {
    const readings = deriveDipoleReadings({ ...base, probeX: 0, probeY: 0 })
    expect(readings.totalMagnitude).toBeGreaterThan(readings.positiveMagnitude)
    expect(readings.potential).toBeCloseTo(0, 8)
  })

  it('builds paired positive and negative contour rings', () => {
    const rings = buildContourRings(4, 5)
    expect(rings).toHaveLength(10)
    expect(rings.filter((ring) => ring.polarity === 'positive')).toHaveLength(5)
    expect(rings.every((ring) => ring.radius > 0 && Number.isFinite(ring.center[0]))).toBe(true)
  })
})
