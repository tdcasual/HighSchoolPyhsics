import { describe, expect, it } from 'vitest'
import { micrometerBowPoints, revolvePoint } from './geometry'

describe('measuring-tools geometry frame', () => {
  it('starts the micrometer bow at 168 degrees on the outer radius', () => {
    const points = micrometerBowPoints()
    const angle = 168 * Math.PI / 180
    expect(points).toHaveLength(70)
    expect(points[0][0]).toBeCloseTo(9 + 31 * Math.cos(angle), 8)
    expect(points[0][1]).toBeCloseTo(-2 + 31 * Math.sin(angle), 8)
  })

  it('revolves around +x with phi = 0 on +z', () => {
    expect(revolvePoint(44, 5.3, 0)).toEqual([44, 0, 5.3])
    expect(revolvePoint(0, 1, Math.PI / 2)[1]).toBeCloseTo(1, 8)
    expect(revolvePoint(0, 1, Math.PI / 2)[2]).toBeCloseTo(0, 8)
  })
})
