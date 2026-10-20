import { describe, expect, it } from 'vitest'
import { CIRCULAR_OFFSET, ORBIT_NODE, scenarioOf, worldOrbit } from './model'
import { CELESTIAL_CAMERA, celestialPose, celestialView, diagramDepth, diagramScale, drawnOrbitRadius, labToScene, outerRadius } from './pose'

describe('celestial pose', () => {
  it('maps lab north to scene up and keeps the orbit radius', () => {
    const north = labToScene({ x: 0, y: 0, z: 1 })
    expect(north[1]).toBeCloseTo(1, 12)
    expect(north[0]).toBeCloseTo(0, 12)
    expect(north[2]).toBeCloseTo(0, 12)
    const east = labToScene(worldOrbit(2, Math.PI / 2, 0, 0))
    expect(east[0]).toBeCloseTo(0, 12)
    expect(east[1]).toBeCloseTo(0, 12)
    expect(east[2]).toBeCloseTo(-2, 12)
    const up = labToScene(worldOrbit(2, Math.PI / 2, Math.PI / 2, 0))
    expect(up[0]).toBeCloseTo(0, 12)
    expect(up[1]).toBeCloseTo(2, 12)
    expect(up[2]).toBeCloseTo(0, 12)
    expect(diagramDepth([0, 0, 1], 0, 0)).toBeLessThan(0)
    expect(diagramDepth([0, 0, -1], 0, 0)).toBeGreaterThan(0)
  })

  it('seats the default satellite on the shared orbit formula', () => {
    const scenario = scenarioOf({ mode: 'circular', body: 'earth', r1: 1.1, r2: 3, phaseDeg: 90, inclinationDeg: 0, time: 0 })
    const pose = celestialPose({ scenario, showVectors: true, showArea: true, showPlane: true, corotate: false })
    const scale = diagramScale(scenario)
    expect(scale).toBeCloseTo((184 / 1.1) / 47, 10)
    const expected = labToScene(worldOrbit(1.1 * scale, CIRCULAR_OFFSET, 0, ORBIT_NODE))
    const position = pose.satellites[0]?.position ?? [0, 0, 0]
    expect(position[0]).toBeCloseTo(expected[0], 8)
    expect(position[1]).toBeCloseTo(expected[1], 8)
    expect(position[2]).toBeCloseTo(expected[2], 8)
    expect(Math.hypot(...(pose.satellites[0]?.position ?? [0, 0, 0]))).toBeCloseTo(184 / 47, 8)
    expect(pose.orbits[0]?.points).toHaveLength(129)
    expect(pose.wedges[0]?.points).toHaveLength(29)
    expect(pose.transfer).toBeNull()
    expect(outerRadius(scenario)).toBeCloseTo(drawnOrbitRadius(scenario), 8)
  })

  it('frames a wide synchronous orbit and marks both burn points', () => {
    const sync = scenarioOf({ mode: 'synchronous', body: 'moon', r1: 2, r2: 4, phaseDeg: 110, inclinationDeg: 0, time: 0 })
    expect(drawnOrbitRadius(sync)).toBeCloseTo(184 / 48, 8)
    const mobileView = celestialView(-25, 42, drawnOrbitRadius(sync), { aspect: 1.36 })
    const bound = drawnOrbitRadius(sync) * 1.22
    expect(mobileView.target).toEqual([0, 0, 0])
    expect(Math.asin(bound / mobileView.radius)).toBeLessThan((16 * Math.PI) / 180)
    // Beside the panel column: the body stays the target and is shifted to the area's centre.
    const desktopView = celestialView(-35, 44, drawnOrbitRadius(sync), { aspect: 1.5, centerOffsetPixels: 154, viewportHeight: 589 })
    expect(desktopView.target).toEqual([0, 0, 0])
    expect(desktopView.screenOffset).toEqual([154, 0])
    // Below the panels on a phone: a shorter area means a farther camera.
    const below = celestialView(-35, 44, drawnOrbitRadius(sync), { aspect: 1.5, heightFraction: 0.6 })
    expect(below.radius).toBeGreaterThan(celestialView(-35, 44, drawnOrbitRadius(sync), { aspect: 1.5 }).radius)
    expect(CELESTIAL_CAMERA.fov).toBe(32)
    expect(CELESTIAL_CAMERA.minDistance).toBe(6)
    expect(CELESTIAL_CAMERA.maxDistance).toBe(26)
    const transfer = scenarioOf({ mode: 'transfer', body: 'earth', r1: 1.2, r2: 4, phaseDeg: 0, inclinationDeg: 26, time: 0 })
    const pose = celestialPose({ scenario: transfer, showVectors: false, showArea: false, showPlane: true, corotate: true })
    const transferScale = diagramScale(transfer)
    expect(Math.hypot(...(pose.periapsis ?? [0, 0, 0]))).toBeCloseTo(1.2 * transferScale, 5)
    expect(Math.hypot(...(pose.apoapsis ?? [0, 0, 0]))).toBeCloseTo(4 * transferScale, 5)
    expect(pose.corotate).toBe(false)
  })
})
