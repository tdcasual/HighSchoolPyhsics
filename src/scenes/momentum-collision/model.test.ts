import { describe, expect, it } from 'vitest'
import { collide, glidersAt } from './model'

const base = { massA: 0.2, massB: 0.2, velocityA: 0.6, velocityB: 0, kind: 'elastic' as const }

describe('collision model', () => {
  it('equal masses, elastic, B at rest: the velocities swap', () => {
    const out = collide(base)
    expect(out.velocityAAfter).toBeCloseTo(0, 12)
    expect(out.velocityBAfter).toBeCloseTo(0.6, 12)
    expect(out.kineticAfter).toBeCloseTo(out.kineticBefore, 12)
  })

  it('conserves momentum for every kind; perfectly inelastic moves together and loses the most Ek', () => {
    const p = { massA: 0.3, massB: 0.1, velocityA: 0.5, velocityB: -0.2 }
    const losses = (['elastic', 'inelastic', 'perfectly-inelastic'] as const).map((kind) => {
      const out = collide({ ...p, kind })
      expect(out.momentumAfter).toBeCloseTo(out.momentumBefore, 12)
      return out.kineticBefore - out.kineticAfter
    })
    expect(losses[0]).toBeCloseTo(0, 12)
    expect(losses[1]).toBeGreaterThan(0)
    expect(losses[2]).toBeGreaterThan(losses[1])
    const stick = collide({ ...p, kind: 'perfectly-inelastic' })
    expect(stick.velocityAAfter).toBeCloseTo(stick.velocityBAfter, 12)
    expect(stick.velocityAAfter).toBeCloseTo((0.3 * 0.5 - 0.1 * 0.2) / 0.4, 12)
  })

  it('gliders touch exactly at the contact time and never pass through each other', () => {
    const out = collide(base)
    const at = glidersAt(base, out.contactTime)
    expect(at.xB - at.xA).toBeCloseTo(0.2, 9)
    const later = glidersAt(base, out.contactTime + 0.5)
    expect(later.xB - later.xA).toBeGreaterThanOrEqual(0.2 - 1e-9)
  })

  it('no collision when A is not faster than B', () => {
    expect(collide({ ...base, velocityA: 0.1, velocityB: 0.3 }).collides).toBe(false)
  })
})
