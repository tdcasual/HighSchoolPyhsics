import { describe, expect, it } from 'vitest'
import {
  DEE_TOP_Y,
  TRAJECTORY_Y,
  deriveGapWidthScene,
  projectParticleToScene,
} from './layout'

describe('cyclotron scene layout', () => {
  it('keeps trajectory plane above dee top surface', () => {
    expect(TRAJECTORY_Y).toBeGreaterThan(DEE_TOP_Y)
    expect(TRAJECTORY_Y - DEE_TOP_Y).toBeLessThanOrEqual(0.006)

    const point = projectParticleToScene({ x: 0, y: 0 })
    expect(point[1]).toBe(TRAJECTORY_Y)
  })

  it('maps physical gap width to visible gap width with reasonable bounds', () => {
    const nearDefault = deriveGapWidthScene(5.3125e-5)
    const tooSmall = deriveGapWidthScene(0)
    const tooLarge = deriveGapWidthScene(0.001)

    expect(nearDefault).toBeCloseTo(0.28, 2)
    expect(tooSmall).toBeGreaterThanOrEqual(0.06)
    expect(tooLarge).toBeLessThanOrEqual(0.28)
  })
})
