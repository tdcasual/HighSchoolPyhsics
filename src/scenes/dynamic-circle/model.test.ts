import { describe, expect, it } from 'vitest'
import { buildRadiusTrace, buildTrajectory, deriveDynamicReadings, radiusFromField } from './model'

describe('dynamic-circle model', () => {
  it('uses the high-school radius relation R = mv / |qB|', () => {
    expect(radiusFromField(12, 0.1)).toBeCloseTo(120)
    expect(radiusFromField(12, -0.1)).toBeCloseTo(120)
    expect(radiusFromField(12, 0)).toBeGreaterThan(100000)
  })

  it('changes direction with the field sign and exposes a moving particle', () => {
    const positive = buildTrajectory({ B: 0.1, v: 12, thetaDeg: 0, y0: 330, elapsed: 0.8, mode: 'scaling', sweep: false })
    const negative = buildTrajectory({ B: -0.1, v: 12, thetaDeg: 0, y0: 330, elapsed: 0.8, mode: 'scaling', sweep: false })
    expect(positive.trajectory.length).toBeGreaterThan(100)
    expect(positive.particle.y).not.toBeCloseTo(negative.particle.y)
    expect(positive.deflectionDeg).toBeGreaterThan(0)
  })

  it('flags a trajectory that crosses a straight boundary', () => {
    const readings = deriveDynamicReadings({ mode: 'scaling', boundary: 'straight', B: 0.1, v: 12, thetaDeg: 0, y0: 330, xBound: 320, triangleX: 480, triangleHeight: 300, circleCenter: { x: 380, y: 330 }, circleRadius: 120, elapsed: 0, sweep: false })
    expect(readings.boundaryDistance).toBe(70)
    expect(readings.hitBoundary).toBe(true)
    expect(readings.status).toBe('escaped')
  })

  it('builds a finite trace for the radius chart', () => {
    const trace = buildRadiusTrace(0.1, 12, 7)
    expect(trace).toHaveLength(7)
    expect(trace[0][1]).toBeLessThan(trace.at(-1)?.[1] ?? 0)
  })
})
