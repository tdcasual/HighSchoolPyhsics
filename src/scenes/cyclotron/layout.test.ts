import { describe, expect, it } from 'vitest'
import { DEE_TOP_Y, TRAJECTORY_Y, deriveGapWidthScene, projectParticleToScene } from './layout'

describe('cyclotron scene layout', () => {
  it('keeps trajectory plane above dee top surface', () => {
    expect(TRAJECTORY_Y).toBeGreaterThan(DEE_TOP_Y)
    expect(TRAJECTORY_Y - DEE_TOP_Y).toBeLessThanOrEqual(0.006)

    const point = projectParticleToScene({ x: 0, y: 0 })
    expect(point[1]).toBe(TRAJECTORY_Y)
  })

  it('draws the gap at its physical width within the slider range', () => {
    expect(deriveGapWidthScene(0.01)).toBeCloseTo(2 * 0.01 * (2.16 / 0.5), 6)
    expect(deriveGapWidthScene(0)).toBeCloseTo(deriveGapWidthScene(0.005), 6)
    expect(deriveGapWidthScene(1)).toBeCloseTo(deriveGapWidthScene(0.02), 6)
  })
})
