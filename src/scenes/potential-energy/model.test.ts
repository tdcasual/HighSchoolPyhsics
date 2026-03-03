import { describe, expect, it } from 'vitest'
import {
  buildPotentialSlicePoints,
  resolveLatheDrawCount,
  summarizeSlice,
  POTENTIAL_SURFACE_FULL_ANGLE,
} from './model'

describe('potential-energy model', () => {
  it('builds positive slice with decreasing potential by radius', () => {
    const points = buildPotentialSlicePoints(1, { sampleCount: 12, radiusStep: 0.4, fieldScale: 12 })
    expect(points).toHaveLength(12)
    expect(points[0].potential).toBeGreaterThan(points[points.length - 1].potential)
    expect(points[0].potential).toBeGreaterThan(0)
  })

  it('builds negative slice with negative potential', () => {
    const points = buildPotentialSlicePoints(-1, { sampleCount: 10, radiusStep: 0.5, fieldScale: 10 })
    expect(points.every((point) => point.potential <= 0)).toBe(true)
  })

  it('summarizes slice bounds and keeps full angle constant', () => {
    const stats = summarizeSlice(buildPotentialSlicePoints(1, { sampleCount: 8, radiusStep: 0.5 }))
    expect(stats.sampleCount).toBe(8)
    expect(stats.maxPotential).toBeGreaterThan(stats.minPotential)
    expect(POTENTIAL_SURFACE_FULL_ANGLE).toBeCloseTo(Math.PI * 2)
  })

  it('maps sweep angle to bounded lathe draw count', () => {
    const total = resolveLatheDrawCount(0.01, { radialSegments: 96, profilePointCount: 60 })
    const mid = resolveLatheDrawCount(Math.PI, { radialSegments: 96, profilePointCount: 60 })
    const full = resolveLatheDrawCount(POTENTIAL_SURFACE_FULL_ANGLE, {
      radialSegments: 96,
      profilePointCount: 60,
    })

    expect(total).toBeGreaterThan(0)
    expect(mid).toBeGreaterThan(total)
    expect(full).toBe(96 * 59 * 6)
  })
})
