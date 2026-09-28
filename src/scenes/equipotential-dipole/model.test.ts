import { describe, expect, it } from 'vitest'
import { buildEquipotentialContours, buildFieldArcLines, deriveDipoleReadings, electricPotentialAt } from './model'

const base = { separation: 4, charge: 3, probeX: 0, probeY: 1.5, flow: true, showEquipotential: true, showVectors: true }

describe('equipotential-dipole model', () => {
  it('matches the SI field benchmark for a 1 μC dipole from the Dmit reference', () => {
    const readings = deriveDipoleReadings({ ...base, separation: 200, charge: 1, probeX: 0, probeY: 100 })
    expect(readings.positiveMagnitude).toBeCloseTo(4500, 0)
    expect(readings.negativeMagnitude).toBeCloseTo(4500, 0)
    expect(readings.totalField.x).toBeCloseTo(6363.96, 0)
    expect(readings.totalField.y).toBeCloseTo(0, 8)
    expect(readings.potential).toBeCloseTo(0, 8)
  })

  it('has equal component fields and zero potential on the perpendicular bisector', () => {
    const readings = deriveDipoleReadings(base)
    expect(readings.potential).toBeCloseTo(0, 8)
    expect(readings.positiveMagnitude).toBeCloseTo(readings.negativeMagnitude, 8)
    expect(readings.totalField.x).toBeGreaterThan(0)
    expect(readings.totalField.y).toBeCloseTo(0, 8)
  })

  it('adds both field vectors between the charges and keeps a nonzero midpoint field', () => {
    const readings = deriveDipoleReadings({ ...base, probeX: 0, probeY: 0 })
    expect(readings.totalMagnitude).toBeCloseTo(readings.positiveMagnitude + readings.negativeMagnitude, 8)
    expect(readings.totalField.x).toBeGreaterThan(0)
    expect(readings.potential).toBeCloseTo(0, 8)
  })

  it('builds curved equipotential contours whose points match their SI potential levels', () => {
    const contours = buildEquipotentialContours(4, 3)
    expect(contours.length).toBeGreaterThan(6)
    expect(contours.some((line) => line.polarity === 'positive')).toBe(true)
    expect(contours.some((line) => line.polarity === 'negative')).toBe(true)
    const contour = contours.find((line) => line.polarity === 'positive' && line.points.length > 20)
    expect(contour).toBeDefined()
    const point = contour!.points[Math.floor(contour!.points.length / 2)]
    const measured = electricPotentialAt(point[0], point[1], 4, 3)
    expect(Math.abs(measured - contour!.value) / Math.abs(contour!.value)).toBeLessThan(0.015)
    const half = 2
    const radii = contour!.points.map((entry) => Math.hypot(entry[0] + half, entry[1]))
    expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(0.08)
  })

  it('integrates field lines tangent to the calculated electric field', () => {
    const lines = buildFieldArcLines(4, 12)
    expect(lines).toHaveLength(12)
    expect(lines.every((line) => line.length > 12 && line.every((point) => point.every(Number.isFinite)))).toBe(true)
    const line = lines.find((entry) => entry.length > 50)!
    const index = Math.floor(line.length / 2)
    const previous = line[index - 1]
    const next = line[index + 1]
    const tangent = { x: next[0] - previous[0], y: next[1] - previous[1] }
    const field = deriveDipoleReadings({ ...base, probeX: line[index][0], probeY: line[index][1] }).totalField
    const cosine = (tangent.x * field.x + tangent.y * field.y) / (Math.hypot(tangent.x, tangent.y) * Math.hypot(field.x, field.y))
    expect(cosine).toBeGreaterThan(0.995)
  })
})
