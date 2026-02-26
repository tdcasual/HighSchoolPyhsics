import { describe, expect, it } from 'vitest'
import {
  CHAMBER_BASE_RADIUS,
  CYCLOTRON_CAMERA,
  CYCLOTRON_CONTROLS,
  POWER_FEED_TERMINALS,
} from './view'

describe('cyclotron scene view constraints', () => {
  it('keeps orbit controls above chamber plane to avoid underside clipping', () => {
    expect(CYCLOTRON_CONTROLS.maxPolarAngle).toBeLessThan(Math.PI / 2)
    expect(CYCLOTRON_CONTROLS.minPolarAngle).toBeGreaterThan(0)
  })

  it('places camera far enough to frame the whole chamber', () => {
    const [x, y, z] = CYCLOTRON_CAMERA.position
    const [tx, ty, tz] = CYCLOTRON_CONTROLS.target
    const distance = Math.hypot(x - tx, y - ty, z - tz)
    expect(distance).toBeGreaterThan(CHAMBER_BASE_RADIUS * 2)
  })

  it('keeps power-feed terminals inside chamber footprint', () => {
    for (const [x, , z] of POWER_FEED_TERMINALS) {
      expect(Math.hypot(x, z)).toBeLessThanOrEqual(CHAMBER_BASE_RADIUS)
    }
  })
})
