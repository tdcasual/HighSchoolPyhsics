type DiscoveryLevel = 'low' | 'medium' | 'high'

type OerstedNeedleConfig = {
  currentA: number
  needlePositionM: {
    x: number
    z: number
  }
  initialHeadingDeg: number
  earthFieldMicroT?: number
  minRadiusM?: number
  wireHeightM?: number
  wireHalfLengthM?: number
  wireDirection?: {
    x: number
    y: number
    z: number
  }
}

type OerstedNeedleState = {
  radiusM: number
  wireFieldMicroT: number
  wireFieldVectorMicroT: {
    x: number
    z: number
  }
  earthFieldVectorMicroT: {
    x: number
    z: number
  }
  netFieldVectorMicroT: {
    x: number
    z: number
  }
  targetHeadingDeg: number
  deflectionDeg: number
  observedSwingDeg: number
  discoveryLevel: DiscoveryLevel
}

const MU0 = 4 * Math.PI * 1e-7
const DEFAULT_EARTH_FIELD_MICRO_T = 45
const DEFAULT_MIN_RADIUS_M = 0.02
const DEFAULT_WIRE_HEIGHT_M = 0.03
const DEFAULT_WIRE_HALF_LENGTH_M = 0.18
const NUMERIC_BIOT_SEGMENTS = 120

type Vec3 = {
  x: number
  y: number
  z: number
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

function length(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z)
}

function normalize(v: Vec3): Vec3 {
  const size = length(v)
  if (size < 1e-12) {
    return { x: 0, y: 0, z: 1 }
  }
  return {
    x: v.x / size,
    y: v.y / size,
    z: v.z / size,
  }
}

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

function scale(v: Vec3, scalar: number): Vec3 {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

function normalizeAngleDeg(value: number): number {
  const wrapped = value % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

function shortestSignedAngleDeg(fromDeg: number, toDeg: number): number {
  const delta = ((toDeg - fromDeg + 540) % 360) - 180
  return delta
}

function deriveDiscoveryLevel(observedSwingDeg: number): DiscoveryLevel {
  const amplitude = Math.abs(observedSwingDeg)
  if (amplitude < 6) {
    return 'low'
  }
  if (amplitude < 16) {
    return 'medium'
  }
  return 'high'
}

export function deriveOerstedNeedleState(config: OerstedNeedleConfig): OerstedNeedleState {
  const earthFieldMicroT = config.earthFieldMicroT ?? DEFAULT_EARTH_FIELD_MICRO_T
  const minRadiusM = config.minRadiusM ?? DEFAULT_MIN_RADIUS_M
  const wireHeightM = Math.max(0.005, config.wireHeightM ?? DEFAULT_WIRE_HEIGHT_M)
  const wireHalfLengthM = Math.max(0.05, config.wireHalfLengthM ?? DEFAULT_WIRE_HALF_LENGTH_M)
  const rawDirection = config.wireDirection ?? { x: 0, y: 0, z: 1 }
  const wireDirection = normalize(rawDirection)
  const wireCenter: Vec3 = { x: 0, y: wireHeightM, z: 0 }
  const samplePoint: Vec3 = {
    x: config.needlePositionM.x,
    y: 0,
    z: config.needlePositionM.z,
  }

  const projectionLength = dot(sub(samplePoint, wireCenter), wireDirection)
  const nearestOnInfinite = add(wireCenter, scale(wireDirection, projectionLength))
  const perpendicular = sub(samplePoint, nearestOnInfinite)
  const radiusM = Math.max(minRadiusM, length(perpendicular))

  const startPoint = add(wireCenter, scale(wireDirection, -wireHalfLengthM))
  const segmentLengthM = (wireHalfLengthM * 2) / NUMERIC_BIOT_SEGMENTS
  const dl = scale(wireDirection, segmentLengthM)
  let wireFieldT: Vec3 = { x: 0, y: 0, z: 0 }

  for (let i = 0; i < NUMERIC_BIOT_SEGMENTS; i += 1) {
    const centerOffset = segmentLengthM * (i + 0.5)
    const elementCenter = add(startPoint, scale(wireDirection, centerOffset))
    const r = sub(samplePoint, elementCenter)
    const rNorm = length(r)
    if (rNorm < 1e-9) {
      continue
    }
    const dB = scale(cross(dl, r), (MU0 * config.currentA) / (4 * Math.PI * rNorm ** 3))
    wireFieldT = add(wireFieldT, dB)
  }

  const wireFieldVectorMicroT = {
    x: wireFieldT.x * 1e6,
    z: wireFieldT.z * 1e6,
  }

  const earthFieldVectorMicroT = {
    x: 0,
    z: earthFieldMicroT,
  }

  const netFieldVectorMicroT = {
    x: earthFieldVectorMicroT.x + wireFieldVectorMicroT.x,
    z: earthFieldVectorMicroT.z + wireFieldVectorMicroT.z,
  }

  const targetHeadingDeg = normalizeAngleDeg(
    // Heading definition: 0° = geographic north (+z), 90° = east (+x)
    toDegrees(Math.atan2(netFieldVectorMicroT.x, netFieldVectorMicroT.z)),
  )

  const deflectionDeg = shortestSignedAngleDeg(0, targetHeadingDeg)
  const observedSwingDeg = shortestSignedAngleDeg(config.initialHeadingDeg, targetHeadingDeg)

  return {
    radiusM,
    wireFieldMicroT: Math.hypot(wireFieldVectorMicroT.x, wireFieldVectorMicroT.z),
    wireFieldVectorMicroT,
    earthFieldVectorMicroT,
    netFieldVectorMicroT,
    targetHeadingDeg,
    deflectionDeg,
    observedSwingDeg,
    discoveryLevel: deriveDiscoveryLevel(observedSwingDeg),
  }
}

export function stepNeedleHeading(
  currentHeadingDeg: number,
  targetHeadingDeg: number,
  deltaS: number,
  responseHz = 6,
): number {
  const safeDeltaS = Math.max(0, deltaS)
  const gain = 1 - Math.exp(-Math.max(0, responseHz) * safeDeltaS)
  const deltaDeg = shortestSignedAngleDeg(currentHeadingDeg, targetHeadingDeg)
  return normalizeAngleDeg(currentHeadingDeg + deltaDeg * gain)
}

export function describeDiscoveryLevel(level: DiscoveryLevel): string {
  if (level === 'high') {
    return '高：摆放有利，偏转明显，容易观察到电流磁效应。'
  }
  if (level === 'medium') {
    return '中：可见偏转，但需要更细致观察。'
  }
  return '低：摆放不利，磁针几乎不动，难以直观看到该效应。'
}
