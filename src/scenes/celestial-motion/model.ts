export const G = 6.67430e-11
export const SIDEREAL_DAY = 86164.0905
export const ORBIT_NODE = 0.16
// Keep the tilted sync orbit aligned with groundPoint's longitude convention.
export const SYNC_NODE = 0
export const CIRCULAR_OFFSET = -0.6

export type BodyId = 'earth' | 'moon' | 'sun'
export type OrbitMode = 'circular' | 'synchronous' | 'rendezvous' | 'transfer'

export type BodyRecord = {
  id: BodyId
  name: string
  M: number
  R: number
  color: string
  land: string
}

export const BODIES: Record<BodyId, BodyRecord> = {
  earth: { id: 'earth', name: '地球', M: 5.972e24, R: 6.371e6, color: '#2b73b6', land: '#74a85d' },
  moon: { id: 'moon', name: '月球', M: 7.342e22, R: 1.7374e6, color: '#a9aaa5', land: '#d7d1c2' },
  sun: { id: 'sun', name: '太阳', M: 1.9885e30, R: 6.9634e8, color: '#f1a340', land: '#ffd166' },
}

export type LabVec = { x: number; y: number; z: number }
export type CircularElements = { v: number; omega: number; T: number; a: number }

export type Scenario = {
  mode: OrbitMode
  body: BodyRecord
  q1: number
  q2: number
  r1: number
  r2: number
  phase: number
  inclination: number
  time: number
  mu: number
  o1: CircularElements
  o2: CircularElements
  semi: number
  eccentricity: number
  transT: number
  vp: number
  va: number
  dv1: number
  dv2: number
  synodic: number
  surfaceG: number
  node: number
}

export type Craft = {
  id: string
  label: string
  color: string
  position: LabVec
  ahead: LabVec
  plane: { x: number; y: number }
}

export function circularOrbit(mu: number, radius: number): CircularElements {
  return {
    v: Math.sqrt(mu / radius),
    omega: Math.sqrt(mu / radius ** 3),
    T: 2 * Math.PI * Math.sqrt(radius ** 3 / mu),
    a: mu / radius ** 2,
  }
}

export function surfaceSpeeds(mu: number, radius: number) {
  const v1 = Math.sqrt(mu / radius)
  return { v1, v2: Math.SQRT2 * v1 }
}

export function estimatedMass(radius: number, period: number) {
  return (4 * Math.PI ** 2 * radius ** 3) / (G * period ** 2)
}

export function synchronousRadius(body: BodyRecord) {
  const mu = G * body.M
  return Math.cbrt(mu * (SIDEREAL_DAY / (2 * Math.PI)) ** 2)
}

export function solveE(meanAnomaly: number, eccentricity: number) {
  let eccentric = meanAnomaly
  for (let step = 0; step < 8; step += 1) {
    eccentric -= (eccentric - eccentricity * Math.sin(eccentric) - meanAnomaly) / (1 - eccentricity * Math.cos(eccentric))
  }
  return eccentric
}

export function transferRadius(scenario: Scenario) {
  const progress = Math.max(0, Math.min(1, scenario.time / scenario.transT))
  const eccentric = solveE(Math.PI * progress, scenario.eccentricity)
  return scenario.semi * (1 - scenario.eccentricity * Math.cos(eccentric))
}

export function transferSpeed(scenario: Scenario) {
  const radius = transferRadius(scenario)
  return Math.sqrt(scenario.mu * (2 / radius - 1 / scenario.semi))
}

export function transferAngularSpeed(scenario: Scenario) {
  const radius = transferRadius(scenario)
  const angularMomentum = Math.sqrt(scenario.mu * scenario.semi * (1 - scenario.eccentricity ** 2))
  return angularMomentum / radius ** 2
}

export function worldOrbit(radius: number, angle: number, inclination: number, node = 0): LabVec {
  const x0 = radius * Math.cos(angle)
  const y0 = radius * Math.sin(angle) * Math.cos(inclination)
  const z0 = radius * Math.sin(angle) * Math.sin(inclination)
  const cosine = Math.cos(node)
  const sine = Math.sin(node)
  return { x: x0 * cosine - y0 * sine, y: x0 * sine + y0 * cosine, z: z0 }
}

export function worldTransfer(semiMajor: number, semiMinor: number, eccentricity: number, eccentricAnomaly: number, inclination: number, node = 0): LabVec {
  const x0 = semiMajor * (Math.cos(eccentricAnomaly) - eccentricity)
  const y0 = semiMinor * Math.sin(eccentricAnomaly)
  const cosine = Math.cos(node)
  const sine = Math.sin(node)
  const yp = y0 * Math.cos(inclination)
  return { x: x0 * cosine - yp * sine, y: x0 * sine + yp * cosine, z: y0 * Math.sin(inclination) }
}

export function groundPoint(inclination: number, phase: number, time: number) {
  const omega = (2 * Math.PI) / SIDEREAL_DAY
  const theta = omega * time
  const u = omega * time + phase
  const inertialLongitude = Math.atan2(Math.sin(u) * Math.cos(inclination), Math.cos(u))
  const longitude = Math.atan2(Math.sin(inertialLongitude - theta), Math.cos(inertialLongitude - theta))
  return {
    u,
    theta,
    inertialLongitude,
    longitude,
    latitude: Math.asin(Math.sin(u) * Math.sin(inclination)),
  }
}

export function scenarioOf(input: {
  mode: OrbitMode
  body: BodyId
  r1: number
  r2: number
  phaseDeg: number
  inclinationDeg: number
  time: number
}): Scenario {
  const body = input.mode === 'synchronous' ? BODIES.earth : BODIES[input.body]
  const mu = G * body.M
  let q1 = input.r1
  let q2 = input.r2
  if (input.mode === 'synchronous') q1 = synchronousRadius(body) / body.R
  if (q2 <= q1 + 0.1) q2 = q1 + 0.1
  const r1 = q1 * body.R
  const r2 = q2 * body.R
  const o1 = circularOrbit(mu, r1)
  const o2 = circularOrbit(mu, r2)
  const semi = (r1 + r2) / 2
  const eccentricity = (r2 - r1) / (r2 + r1)
  const transT = Math.PI * Math.sqrt(semi ** 3 / mu)
  const vp = Math.sqrt(mu * (2 / r1 - 1 / semi))
  const va = Math.sqrt(mu * (2 / r2 - 1 / semi))
  return {
    mode: input.mode,
    body,
    q1,
    q2,
    r1,
    r2,
    phase: (input.phaseDeg * Math.PI) / 180,
    inclination: (input.inclinationDeg * Math.PI) / 180,
    time: input.time,
    mu,
    o1,
    o2,
    semi,
    eccentricity,
    transT,
    vp,
    va,
    dv1: vp - o1.v,
    dv2: o2.v - va,
    synodic: (2 * Math.PI) / Math.abs(o1.omega - o2.omega),
    surfaceG: mu / body.R ** 2,
    node: input.mode === 'synchronous' ? SYNC_NODE : ORBIT_NODE,
  }
}

export function playbackScale(scenario: Scenario) {
  if (scenario.mode === 'synchronous') return SIDEREAL_DAY / 18
  if (scenario.mode === 'transfer') return scenario.transT / 12
  return scenario.o1.T / 14
}

export function earthSpin(scenario: Scenario) {
  if (scenario.body.id === 'earth') return (2 * Math.PI * scenario.time) / SIDEREAL_DAY
  return scenario.time * 0.00018
}

export function isStationary(scenario: Scenario) {
  return scenario.mode === 'synchronous' && scenario.inclination < 0.001
}

function ring(radius: number, inclination: number, node: number, steps = 128) {
  return Array.from({ length: steps + 1 }, (_, index) => worldOrbit(radius, (Math.PI * 2 * index) / steps, inclination, node))
}

export function orbitSamples(scenario: Scenario, which: 1 | 2) {
  return ring(which === 1 ? scenario.q1 : scenario.q2, scenario.inclination, scenario.node)
}

export function transferSamples(scenario: Scenario) {
  const semiMajor = scenario.semi / scenario.body.R
  const semiMinor = semiMajor * Math.sqrt(1 - scenario.eccentricity ** 2)
  return Array.from({ length: 161 }, (_, index) => worldTransfer(
    semiMajor,
    semiMinor,
    scenario.eccentricity,
    (Math.PI * 2 * index) / 160,
    scenario.inclination,
    scenario.node,
  ))
}

export function craftsAt(scenario: Scenario): Craft[] {
  const { inclination, node } = scenario
  if (scenario.mode === 'circular') {
    const angle = scenario.o1.omega * scenario.time + CIRCULAR_OFFSET
    return [craft('satellite', '卫星', '#d9480f', scenario.q1, angle, angle + 0.015, inclination, node)]
  }
  if (scenario.mode === 'rendezvous') {
    const inner = scenario.o1.omega * scenario.time
    const outer = scenario.phase + scenario.o2.omega * scenario.time
    return [
      craft('satellite-a', 'A 内轨', '#d9480f', scenario.q1, inner, inner + 0.015, inclination, node),
      craft('satellite-b', 'B 外轨', '#5dade2', scenario.q2, outer, outer + 0.015, inclination, node),
    ]
  }
  if (scenario.mode === 'synchronous') {
    const point = groundPoint(inclination, scenario.phase, scenario.time)
    const label = isStationary(scenario) ? '静止卫星' : '同步卫星'
    return [craft('satellite', label, '#d9480f', scenario.q1, point.u, point.u + 0.015, inclination, node)]
  }
  const progress = Math.min(1, scenario.time / scenario.transT)
  const eccentric = solveE(Math.PI * progress, scenario.eccentricity)
  const semiMajor = scenario.semi / scenario.body.R
  const semiMinor = semiMajor * Math.sqrt(1 - scenario.eccentricity ** 2)
  const at = (anomaly: number) => worldTransfer(semiMajor, semiMinor, scenario.eccentricity, anomaly, inclination, node)
  const position = at(eccentric)
  return [{
    id: 'satellite',
    label: '转移器',
    color: '#d9480f',
    position,
    ahead: at(eccentric + 0.012),
    plane: {
      x: semiMajor * (Math.cos(eccentric) - scenario.eccentricity),
      y: semiMinor * Math.sin(eccentric),
    },
  }]
}

function craft(id: string, label: string, color: string, radius: number, angle: number, ahead: number, inclination: number, node: number): Craft {
  return {
    id,
    label,
    color,
    position: worldOrbit(radius, angle, inclination, node),
    ahead: worldOrbit(radius, ahead, inclination, node),
    plane: { x: radius * Math.cos(angle), y: radius * Math.sin(angle) },
  }
}

export function areaWedges(scenario: Scenario): Array<{ color: string; points: LabVec[] }> {
  if (scenario.mode === 'circular') {
    const angle = scenario.o1.omega * scenario.time + CIRCULAR_OFFSET
    return [{ color: '#d9480f', points: Array.from({ length: 29 }, (_, index) => worldOrbit(scenario.q1, angle - 0.55 + (0.55 * index) / 28, scenario.inclination, scenario.node)) }]
  }
  if (scenario.mode === 'rendezvous') {
    const inner = scenario.o1.omega * scenario.time
    const outer = scenario.phase + scenario.o2.omega * scenario.time
    const interval = 0.48 / scenario.o1.omega
    const innerSweep = scenario.o1.omega * interval
    const outerSweep = scenario.o2.omega * interval
    return [
      { color: '#d9480f', points: Array.from({ length: 23 }, (_, index) => worldOrbit(scenario.q1, inner - innerSweep + (innerSweep * index) / 22, scenario.inclination, scenario.node)) },
      { color: '#5dade2', points: Array.from({ length: 23 }, (_, index) => worldOrbit(scenario.q2, outer - outerSweep + (outerSweep * index) / 22, scenario.inclination, scenario.node)) },
    ]
  }
  if (scenario.mode === 'transfer') {
    const progress = Math.min(1, scenario.time / scenario.transT)
    const eccentric = solveE(Math.PI * progress, scenario.eccentricity)
    const semiMajor = scenario.semi / scenario.body.R
    const semiMinor = semiMajor * Math.sqrt(1 - scenario.eccentricity ** 2)
    return [{
      color: '#d9480f',
      points: Array.from({ length: 61 }, (_, index) => worldTransfer(
        semiMajor,
        semiMinor,
        scenario.eccentricity,
        (eccentric * index) / 60,
        scenario.inclination,
        scenario.node,
      )),
    }]
  }
  return []
}

export function burnPoints(scenario: Scenario) {
  if (scenario.mode !== 'transfer') return null
  const semiMajor = scenario.semi / scenario.body.R
  const semiMinor = semiMajor * Math.sqrt(1 - scenario.eccentricity ** 2)
  return {
    periapsis: worldTransfer(semiMajor, semiMinor, scenario.eccentricity, 0, scenario.inclination, scenario.node),
    apoapsis: worldTransfer(semiMajor, semiMinor, scenario.eccentricity, Math.PI, scenario.inclination, scenario.node),
  }
}

export function formatSpeed(speed: number) {
  return speed >= 1000 ? `${(speed / 1000).toFixed(3)} km/s` : `${speed.toFixed(1)} m/s`
}

export function formatDuration(seconds: number) {
  if (seconds < 120) return `${seconds.toFixed(1)} s`
  if (seconds < 7200) return `${(seconds / 60).toFixed(1)} min`
  if (seconds < 172800) return `${(seconds / 3600).toFixed(2)} h`
  return `${(seconds / 86400).toFixed(2)} d`
}
