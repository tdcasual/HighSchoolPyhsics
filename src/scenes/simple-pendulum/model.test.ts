import { describe, expect, it } from 'vitest'
import { advancePendulum, measuredPeriod, releaseState, smallAnglePeriod } from './model'

function runPeriods(p: Parameters<typeof releaseState>[0], seconds: number) {
  let state = releaseState(p)
  for (let i = 0; i < seconds * 50; i++) state = advancePendulum(p, state, 0.02)
  return state
}

describe('pendulum model', () => {
  it('small swing: period matches 2π√(L/g) and does not depend on mass', () => {
    const p = { length: 1, amplitudeDeg: 3, gravity: 'earth' as const, mass: 0.1 }
    const measured = measuredPeriod(runPeriods(p, 10))!
    expect(measured).toBeCloseTo(smallAnglePeriod(p), 2)
    expect(measuredPeriod(runPeriods({ ...p, mass: 2 }, 10))!).toBeCloseTo(measured, 9)
  })

  it('large swing: the true period is longer (≈ 1.7 % at 30°)', () => {
    const p = { length: 1, amplitudeDeg: 30, gravity: 'earth' as const, mass: 0.1 }
    const ratio = measuredPeriod(runPeriods(p, 12))! / smallAnglePeriod(p)
    expect(ratio).toBeGreaterThan(1.015)
    expect(ratio).toBeLessThan(1.02)
  })

  it('conserves energy: the swing returns to the release angle', () => {
    const p = { length: 0.8, amplitudeDeg: 20, gravity: 'moon' as const, mass: 0.1 }
    const state = runPeriods(p, 20)
    const energy = (s: typeof state) => 0.5 * (p.length * s.omega) ** 2 + 1.62 * p.length * (1 - Math.cos(s.theta))
    expect(energy(state)).toBeCloseTo(1.62 * p.length * (1 - Math.cos((20 * Math.PI) / 180)), 6)
  })
})
