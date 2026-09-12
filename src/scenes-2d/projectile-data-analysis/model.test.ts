import { describe, expect, it } from 'vitest'
import { buildFlashPoints, buildTrajectoryTrace, deriveProjectileReadings } from './model'

describe('projectile-data-analysis model', () => {
  const params = { initialSpeed: 2, gravity: 10, flashPeriod: 0.15 }
  it('separates horizontal uniform motion and vertical free fall', () => { const reading = deriveProjectileReadings(params, 0.3); expect(reading.x).toBeCloseTo(0.6); expect(reading.y).toBeCloseTo(0.45); expect(reading.vx).toBe(2); expect(reading.vy).toBeCloseTo(3) })
  it('creates equally timed flash points and second difference gT²', () => { const points = buildFlashPoints(params, 5); expect(points).toHaveLength(5); expect(points[1].x - points[0].x).toBeCloseTo(0.3); expect(points[3].deltaY - points[2].deltaY).toBeCloseTo(0.225) })
  it('builds finite parabolic trace', () => { const trace = buildTrajectoryTrace(params, 31); expect(trace).toHaveLength(31); expect(trace.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true) })
})
