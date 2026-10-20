import { describe, expect, it } from 'vitest'
import { G, conicalReadings, turntableReadings } from './model'

describe('circular motion model', () => {
  it('turntable: v = ωr, a = ω²r, F = mω²r and the block slips above √(μg/r)', () => {
    const base = { mass: 0.2, radius: 0.3, omega: 4, mu: 0.4 }
    const r = turntableReadings(base)
    expect(r.speed).toBeCloseTo(1.2, 12)
    expect(r.acceleration).toBeCloseTo(4.8, 12)
    expect(r.requiredForce).toBeCloseTo(0.96, 12)
    expect(r.maxFriction).toBeCloseTo(0.4 * 0.2 * G, 12)
    expect(r.slips).toBe(true)
    expect(r.criticalOmega).toBeCloseTo(Math.sqrt((0.4 * G) / 0.3), 12)
    expect(turntableReadings({ ...base, omega: r.criticalOmega * 0.99 }).slips).toBe(false)
  })

  it('conical pendulum: cosθ = g/(ω²L), tension mω²L, horizontal net force mg·tanθ', () => {
    const p = { mass: 0.1, length: 1, omega: 4 }
    const r = conicalReadings(p)
    expect(Math.cos(r.angle)).toBeCloseTo(G / 16, 12)
    expect(r.tension).toBeCloseTo(1.6, 12)
    // Vertical balance and horizontal centripetal force.
    expect(r.tension * Math.cos(r.angle)).toBeCloseTo(p.mass * G, 9)
    expect(r.tension * Math.sin(r.angle)).toBeCloseTo(p.mass * p.omega ** 2 * r.radius, 9)
    expect(r.centripetalForce).toBeCloseTo(r.tension * Math.sin(r.angle), 9)
  })

  it('hangs straight down below the threshold angular speed √(g/L)', () => {
    const r = conicalReadings({ mass: 0.1, length: 1, omega: 2 })
    expect(r.angle).toBe(0)
    expect(r.radius).toBe(0)
    expect(r.tension).toBeCloseTo(0.1 * G, 12)
    expect(r.thresholdOmega).toBeCloseTo(Math.sqrt(G), 12)
  })
})
