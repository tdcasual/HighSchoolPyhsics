import { describe, expect, it } from 'vitest'
import {
  BODIES,
  CIRCULAR_OFFSET,
  G,
  ORBIT_NODE,
  SIDEREAL_DAY,
  areaWedges,
  circularOrbit,
  craftsAt,
  formatSpeed,
  groundPoint,
  playbackScale,
  scenarioOf,
  solveE,
  surfaceSpeeds,
  synchronousRadius,
  worldOrbit,
  worldTransfer,
} from './model'

const earth = {
  mode: 'circular' as const,
  body: 'earth' as const,
  r1: 1.1,
  r2: 3,
  phaseDeg: 90,
  inclinationDeg: 0,
  time: 0,
}

describe('celestial model', () => {
  it('gives Earth the first cosmic speed and a synchronous orbit of 6.62 radii', () => {
    const speeds = surfaceSpeeds(G * BODIES.earth.M, BODIES.earth.R)
    expect(speeds.v1).toBeCloseTo(7909.680821529872, 6)
    expect(speeds.v2).toBeCloseTo(speeds.v1 * Math.SQRT2, 8)
    expect(formatSpeed(speeds.v1)).toBe('7.910 km/s')
    const radius = synchronousRadius(BODIES.earth)
    expect(radius / BODIES.earth.R).toBeCloseTo(6.618077710159786, 8)
    expect((radius - BODIES.earth.R) / 1000).toBeCloseTo(35792.773, 2)
    const sync = scenarioOf({ ...earth, mode: 'synchronous', inclinationDeg: 0 })
    expect(sync.o1.T).toBeCloseTo(SIDEREAL_DAY, 4)
    expect(sync.body.id).toBe('earth')
  })

  it('keeps r³/T² equal to GM/4π² and places a circular satellite on the node', () => {
    const scenario = scenarioOf(earth)
    // GM = 4π² r³ / T², with G = 6.674e-11.
    expect((4 * Math.PI ** 2 * scenario.r1 ** 3) / (scenario.o1.T ** 2 * 6.674e-11) / BODIES.earth.M).toBeCloseTo(1, 3)
    expect(worldOrbit(1, 0, 0.4, 0)).toEqual({ x: 1, y: 0, z: 0 })
    const turned = worldOrbit(2, 0, 0.5, ORBIT_NODE)
    expect(turned.x).toBeCloseTo(2 * Math.cos(ORBIT_NODE), 12)
    expect(turned.y).toBeCloseTo(2 * Math.sin(ORBIT_NODE), 12)
    expect(turned.z).toBe(0)
    const craft = craftsAt(scenario)[0]
    const expected = worldOrbit(1.1, CIRCULAR_OFFSET, 0, ORBIT_NODE)
    expect(craft.position).toEqual(expected)
    expect(playbackScale(scenario)).toBeCloseTo(scenario.o1.T / 14, 8)
  })

  it('keeps both rendezvous sweep sectors on the same time interval at different radii', () => {
    const scenarios = [
      scenarioOf({
        ...earth,
        mode: 'rendezvous',
        body: 'earth',
        r1: 1.4,
        r2: 2.2,
        phaseDeg: 100,
        inclinationDeg: 20,
        time: 5000,
      }),
      scenarioOf({
        ...earth,
        mode: 'rendezvous',
        body: 'earth',
        r1: 2.45,
        r2: 7.9,
        phaseDeg: 230,
        inclinationDeg: 55,
        time: 18000,
      }),
      scenarioOf({
        ...earth,
        mode: 'rendezvous',
        body: 'moon',
        r1: 1.5,
        r2: 5.2,
        phaseDeg: 80,
        inclinationDeg: 35,
        time: 1200,
      }),
    ]
    const sweptAngle = (first: { x: number; y: number; z: number }, last: { x: number; y: number; z: number }) => {
      const crossX = first.y * last.z - first.z * last.y
      const crossY = first.z * last.x - first.x * last.z
      const crossZ = first.x * last.y - first.y * last.x
      const crossLength = Math.hypot(crossX, crossY, crossZ)
      const dot = first.x * last.x + first.y * last.y + first.z * last.z
      return Math.atan2(crossLength, dot)
    }

    scenarios.forEach((scenario) => {
      const [inner, outer] = areaWedges(scenario)
      const innerAngle = sweptAngle(inner.points[0], inner.points[inner.points.length - 1])
      const outerAngle = sweptAngle(outer.points[0], outer.points[outer.points.length - 1])
      expect(innerAngle / scenario.o1.omega).toBeCloseTo(outerAngle / scenario.o2.omega, 8)
    })
  })

  it('aligns an inclined synchronous satellite with its reported ground point', () => {
    const sync = scenarioOf({ ...earth, mode: 'synchronous', phaseDeg: 110, inclinationDeg: 30, time: 18000 })
    const point = groundPoint(sync.inclination, sync.phase, sync.time)
    const satellite = craftsAt(sync)[0].position
    const radius = Math.hypot(satellite.x, satellite.y, satellite.z)
    const satelliteLongitude = Math.atan2(satellite.y, satellite.x)
    const longitudeError = Math.atan2(
      Math.sin(satelliteLongitude - point.inertialLongitude),
      Math.cos(satelliteLongitude - point.inertialLongitude),
    )
    expect(sync.node).toBe(0)
    expect(longitudeError).toBeCloseTo(0, 10)
    expect(Math.asin(satellite.z / radius)).toBeCloseTo(point.latitude, 10)
  })

  it('flies the Hohmann ellipse from the inner radius to the outer radius', () => {
    const start = scenarioOf({ ...earth, mode: 'transfer', r1: 1.2, r2: 4, phaseDeg: 0, inclinationDeg: 0, time: 0 })
    expect(start.eccentricity).toBeCloseTo(2.8 / 5.2, 12)
    expect(start.dv1).toBeCloseTo(1735.4322606023925, 4)
    expect(start.vp).toBeGreaterThan(start.va)
    expect(
      Math.hypot(craftsAt(start)[0].position.x, craftsAt(start)[0].position.y, craftsAt(start)[0].position.z),
    ).toBeCloseTo(1.2, 6)
    const end = scenarioOf({
      ...earth,
      mode: 'transfer',
      r1: 1.2,
      r2: 4,
      phaseDeg: 0,
      inclinationDeg: 0,
      time: start.transT,
    })
    expect(
      Math.hypot(craftsAt(end)[0].position.x, craftsAt(end)[0].position.y, craftsAt(end)[0].position.z),
    ).toBeCloseTo(4, 5)
    expect(solveE(0, start.eccentricity)).toBeCloseTo(0, 12)
    expect(solveE(Math.PI, start.eccentricity)).toBeCloseTo(Math.PI, 8)
    const peri = worldTransfer(2.6, 2.6 * Math.sqrt(1 - start.eccentricity ** 2), start.eccentricity, 0, 0, 0)
    expect(peri.x).toBeCloseTo(1.2, 8)
  })

  it('puts a polar synchronous satellite at the inclination latitude', () => {
    const point = groundPoint(Math.PI / 6, Math.PI / 2, 0)
    expect(point.latitude).toBeCloseTo(Math.PI / 6, 10)
    expect(groundPoint(0, 0, 0).longitude).toBeCloseTo(0, 12)
    const meet = scenarioOf({ ...earth, mode: 'rendezvous', r1: 1.4, r2: 2.2 })
    expect(meet.o1.omega).toBeGreaterThan(meet.o2.omega)
    expect(meet.synodic).toBeCloseTo((2 * Math.PI) / (meet.o1.omega - meet.o2.omega), 8)
    expect(circularOrbit(meet.mu, meet.r1).v).toBeGreaterThan(circularOrbit(meet.mu, meet.r2).v)
  })
})
