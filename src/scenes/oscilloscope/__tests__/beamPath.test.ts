import { describe, expect, it } from 'vitest'
import { buildBeamFlightTrailPoints, buildBeamPathPoints, deriveBeamPhase } from '../beamPath'

describe('beam path visibility', () => {
  it('builds dense trajectory points so the beam is visually obvious', () => {
    const points = buildBeamPathPoints(0.2, -0.4)
    expect(points.length).toBeGreaterThanOrEqual(24)
  })

  it('ends near screen hit point based on beam deflection', () => {
    const points = buildBeamPathPoints(1, -1)
    const end = points[points.length - 1]

    expect(end[0]).toBeCloseTo(3.15)
    expect(end[1]).toBeLessThan(0)
    expect(end[2]).toBeGreaterThan(0)
  })

  it('builds a visible in-flight segment while running', () => {
    const path = buildBeamPathPoints(0.6, -0.3)
    const phase = deriveBeamPhase(0.25, true)
    const trail = buildBeamFlightTrailPoints(path, phase, 12)

    expect(trail.length).toBeGreaterThanOrEqual(6)
  })

  it('locks flight segment head at screen end when paused', () => {
    const path = buildBeamPathPoints(-0.2, 0.4)
    const phase = deriveBeamPhase(0.25, false)
    const trail = buildBeamFlightTrailPoints(path, phase, 12)

    expect(trail[trail.length - 1]).toEqual(path[path.length - 1])
  })
})
