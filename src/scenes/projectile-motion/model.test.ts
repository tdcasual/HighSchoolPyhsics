import { describe, expect, it } from 'vitest'
import { G, flightTime, landingVelocity, maxHeight, pointAt, range, strobePoints } from './model'

describe('projectile model', () => {
  it('平抛: t = √(2h/g), x = v₀t, independent of v₀ for the time', () => {
    const p = { speed: 8, angleDeg: 0, height: 5 }
    expect(flightTime(p)).toBeCloseTo(Math.sqrt((2 * 5) / G), 9)
    expect(flightTime({ ...p, speed: 20 })).toBeCloseTo(flightTime(p), 9)
    expect(range(p)).toBeCloseTo(8 * Math.sqrt(10 / G), 9)
  })

  it('斜抛 from the ground: range v₀²sin2θ/g, peak v₀²sin²θ/(2g), symmetric landing', () => {
    const p = { speed: 12, angleDeg: 45, height: 0 }
    expect(range(p)).toBeCloseTo((144 * Math.sin(Math.PI / 2)) / G, 9)
    expect(maxHeight(p)).toBeCloseTo((144 * 0.5) / (2 * G), 9)
    const landing = landingVelocity(p)
    expect(landing.speed).toBeCloseTo(12, 9)
    expect(landing.angleDeg).toBeCloseTo(45, 9)
  })

  it('keeps vx constant and changes vy by g·Δt', () => {
    const p = { speed: 10, angleDeg: 30, height: 2 }
    const a = pointAt(p, 0.2)
    const b = pointAt(p, 0.5)
    expect(b.vx).toBeCloseTo(a.vx, 12)
    expect(a.vy - b.vy).toBeCloseTo(G * 0.3, 9)
  })

  it('places strobe dots every 0.1 s and stops at the ground', () => {
    const p = { speed: 8, angleDeg: 0, height: 5 }
    expect(strobePoints(p, 0.35)).toHaveLength(4)
    expect(strobePoints(p, 10).at(-1)!.y).toBeGreaterThanOrEqual(0)
  })
})
