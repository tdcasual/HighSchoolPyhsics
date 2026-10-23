import type { FramingArea, OrbitView, Vec3 } from '../../scene3d/orbitFraming'
import {
  areaWedges,
  burnPoints,
  craftsAt,
  earthSpin,
  groundPoint,
  orbitSamples,
  transferSamples,
  type LabVec,
  type Scenario,
} from './model'

/** Original diagram keeps the outer orbit at 184 px and the body at 47 px (48 px when synchronous). */
export const DIAGRAM_ORBIT_PX = 184
export const DIAGRAM_BODY_PX = 47
export const DIAGRAM_SYNC_BODY_PX = 48

export const CELESTIAL_CAMERA = {
  fov: 32,
  near: 0.05,
  far: 200,
  minDistance: 6,
  maxDistance: 26,
  minPolarAngle: Math.PI / 2 - (74 * Math.PI) / 180,
  maxPolarAngle: Math.PI / 2 - (16 * Math.PI) / 180,
} as const

export type SatellitePose = {
  id: string
  label: string
  color: string
  position: Vec3
  tangent: Vec3
}

export type CelestialPose = {
  spin: number
  corotate: boolean
  showVectors: boolean
  showPlane: boolean
  planeRadius: number
  bodyColor: string
  landColor: string
  bodyId: Scenario['body']['id']
  orbits: Array<{ id: string; color: string; points: Vec3[] }>
  transfer: Vec3[] | null
  satellites: SatellitePose[]
  wedges: Array<{ color: string; points: Vec3[] }>
  periapsis: Vec3 | null
  apoapsis: Vec3 | null
  subsatellite: Vec3 | null
  station: Vec3 | null
}

/** Lab frame is z-up. Scene frame is Three.js y-up, so north becomes +y. */
export function labToScene(vector: LabVec): Vec3 {
  return [vector.x, vector.z, -vector.y]
}

export function sceneToLab(point: Vec3): LabVec {
  return { x: point[0], y: -point[2], z: point[1] }
}

/** Same depth as celestial-inline.js project3D. Positive depth is behind the body. */
export function diagramDepth(point: Vec3, azimuth: number, elevation: number) {
  const lab = sceneToLab(point)
  const radialY = lab.x * Math.sin(azimuth) + lab.y * Math.cos(azimuth)
  return radialY * Math.cos(elevation) - lab.z * Math.sin(elevation)
}

export function viewAngles(camera: Vec3) {
  return {
    azimuth: Math.atan2(camera[0], camera[2]),
    elevation: Math.atan2(camera[1], Math.hypot(camera[0], camera[2])),
  }
}

export function diagramScale(scenario: Scenario) {
  if (scenario.mode === 'synchronous') return DIAGRAM_ORBIT_PX / DIAGRAM_SYNC_BODY_PX / scenario.q1
  const maxQ = scenario.mode === 'circular' ? scenario.q1 : scenario.q2
  return DIAGRAM_ORBIT_PX / maxQ / DIAGRAM_BODY_PX
}

export function drawnOrbitRadius(scenario: Scenario) {
  return scenario.mode === 'synchronous' ? DIAGRAM_ORBIT_PX / DIAGRAM_SYNC_BODY_PX : DIAGRAM_ORBIT_PX / DIAGRAM_BODY_PX
}

export function outerRadius(scenario: Scenario) {
  return drawnOrbitRadius(scenario)
}

export function frameRadius(outer: number, aspect = 1.6) {
  const verticalHalfFov = (CELESTIAL_CAMERA.fov * Math.PI) / 360
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * Math.max(0.1, aspect))
  const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov)
  const sceneBound = outer * 1.22
  return Math.max(9, (sceneBound / Math.sin(limitingHalfFov)) * 1.12)
}

function scaleLab(vector: LabVec, factor: number): LabVec {
  return { x: vector.x * factor, y: vector.y * factor, z: vector.z * factor }
}

/**
 * Fits the drawn orbits (a sphere of radius `outer` around the central body) into one free
 * area of the canvas, seen from the teacher's 方位 / 仰角. The body stays the orbit target;
 * the screen offset moves it to the area's centre.
 */
export function celestialView(
  azimuthDeg: number,
  elevationDeg: number,
  outer: number,
  area: FramingArea = {},
): OrbitView {
  const heightFraction = Math.max(0.2, area.heightFraction ?? 1)
  return {
    target: [0, 0, 0],
    azimuth: (azimuthDeg * Math.PI) / 180,
    elevation: (elevationDeg * Math.PI) / 180,
    radius: frameRadius(outer / heightFraction, (area.aspect ?? 1.6) / heightFraction),
    screenOffset: [area.centerOffsetPixels ?? 0, area.centerOffsetYPixels ?? 0],
  }
}

function direction(from: Vec3, to: Vec3): Vec3 {
  const delta: Vec3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]]
  const length = Math.hypot(delta[0], delta[1], delta[2]) || 1
  return [delta[0] / length, delta[1] / length, delta[2] / length]
}

export function celestialPose(input: {
  scenario: Scenario
  showVectors: boolean
  showArea: boolean
  showPlane: boolean
  corotate: boolean
}): CelestialPose {
  const { scenario } = input
  const scale = diagramScale(scenario)
  const place = (vector: LabVec) => labToScene(scaleLab(vector, scale))
  const crafts = craftsAt(scenario)
  const orbits = [{ id: 'orbit-inner', color: '#0d5c63', points: orbitSamples(scenario, 1).map(place) }]
  if (scenario.mode === 'rendezvous') {
    orbits.push({ id: 'orbit-outer', color: '#4a6168', points: orbitSamples(scenario, 2).map(place) })
  }
  const burns = burnPoints(scenario)
  const track =
    scenario.mode === 'synchronous' ? groundPoint(scenario.inclination, scenario.phase, scenario.time) : null
  const station = scenario.mode === 'synchronous' ? groundPoint(scenario.inclination, scenario.phase, 0) : null
  const surface = (longitude: number, latitude: number, radius: number): LabVec => ({
    x: radius * Math.cos(latitude) * Math.cos(longitude),
    y: radius * Math.cos(latitude) * Math.sin(longitude),
    z: radius * Math.sin(latitude),
  })
  return {
    spin: earthSpin(scenario),
    corotate: input.corotate && scenario.mode === 'synchronous',
    showVectors: input.showVectors,
    showPlane: input.showPlane,
    planeRadius: drawnOrbitRadius(scenario) * (scenario.mode === 'synchronous' ? 1.08 : 1.1),
    bodyColor: scenario.body.color,
    landColor: scenario.body.land,
    bodyId: scenario.body.id,
    orbits,
    transfer: scenario.mode === 'transfer' ? transferSamples(scenario).map(place) : null,
    satellites: crafts.map((craft) => {
      const position = place(craft.position)
      return {
        id: craft.id,
        label: craft.label,
        color: craft.color,
        position,
        tangent: direction(position, place(craft.ahead)),
      }
    }),
    wedges: input.showArea
      ? areaWedges(scenario).map((wedge) => ({ color: wedge.color, points: wedge.points.map(place) }))
      : [],
    periapsis: burns ? place(burns.periapsis) : null,
    apoapsis: burns ? place(burns.apoapsis) : null,
    subsatellite: track ? labToScene(surface(track.inertialLongitude, track.latitude, 1.04)) : null,
    station: station ? labToScene(surface(station.inertialLongitude, 0, 1.04)) : null,
  }
}
