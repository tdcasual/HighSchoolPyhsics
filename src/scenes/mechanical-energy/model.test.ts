import { describe, expect, it } from 'vitest'
import { G, advanceMotion, energiesOf, releaseMotion } from './model'

describe('mechanical energy model', () => {
  it('conserves E = Ek + Ep on a smooth track and returns to the release height', () => {
    const p = { mass: 1, releaseHeight: 1.5, mu: 0 }
    let motion = releaseMotion(p)
    const start = energiesOf(p, motion).mechanical
    let maxRightHeight = 0
    let maxSpeed = 0
    for (let i = 0; i < 400; i++) {
      motion = advanceMotion(p, motion, 0.01)
      const e = energiesOf(p, motion)
      expect(Math.abs(e.mechanical - start) / start).toBeLessThan(1e-3)
      if (motion.x > 0) maxRightHeight = Math.max(maxRightHeight, e.height)
      maxSpeed = Math.max(maxSpeed, Math.abs(motion.v))
    }
    expect(maxRightHeight).toBeCloseTo(1.5, 2)
    // At the bottom: v = √(2gh).
    expect(maxSpeed).toBeCloseTo(Math.sqrt(2 * G * 1.5), 2)
  })

  it('with friction: E decreases, E + Q stays constant, and the block comes to rest', () => {
    const p = { mass: 0.5, releaseHeight: 1.5, mu: 0.1 }
    let motion = releaseMotion(p)
    const start = energiesOf(p, motion).mechanical
    let previous = start
    for (let i = 0; i < 4000 && !motion.stopped; i++) {
      motion = advanceMotion(p, motion, 0.01)
      const e = energiesOf(p, motion)
      expect(e.mechanical).toBeLessThanOrEqual(previous + 1e-9)
      expect(Math.abs(e.mechanical + e.heat - start) / start).toBeLessThan(5e-3)
      previous = e.mechanical
    }
    expect(motion.stopped).toBe(true)
    expect(energiesOf(p, motion).mechanical).toBeLessThan(start * 0.5)
  })
})
