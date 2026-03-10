export type VelocityPreset = 'forward' | 'backward' | 'up' | 'down' | 'angle-30' | 'angle-45' | 'angle-60'
export type MagneticFieldDirection = 'up' | 'down'

export type MotionalEmfConfig = {
  magneticFieldT: number
  magneticFieldDirection: MagneticFieldDirection
  rodLengthM: number
  speedMps: number
  rodAngleDeg: number
  velocityPreset: VelocityPreset
}

export type MotionalEmfReadings = {
  signedVoltageV: number
  voltageMagnitudeV: number
  effectiveCuttingRatio: number
}

type Vec3 = {
  x: number
  y: number
  z: number
}

export type MotionOffset = [number, number, number]

export type ContactOffsetPair = {
  left: MotionOffset
  right: MotionOffset
}

export type TravelProgressOptions = {
  previous: number
  deltaS: number
  speedMps: number
  travelSpan?: number
}

export type TeachingVectorAnchors = {
  velocity: MotionOffset
  current: MotionOffset
}

const DEFAULT_TRAVEL_SPAN = 2.2

export const VELOCITY_PRESET_LABELS: Record<VelocityPreset, string> = {
  forward: '前进（标准切割）',
  backward: '后退（反向切割）',
  up: '向上',
  down: '向下',
  'angle-30': '与 B 成 30°',
  'angle-45': '与 B 成 45°',
  'angle-60': '与 B 成 60°',
}

export const MAGNETIC_FIELD_DIRECTION_LABELS: Record<MagneticFieldDirection, string> = {
  up: '向上',
  down: '向下',
}

export const ROD_ANGLE_OPTIONS = [90, 60, 45, 30] as const

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

function scale(vector: Vec3, scalar: number): Vec3 {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
    z: vector.z * scalar,
  }
}

function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(vector.x, vector.y, vector.z)
  if (length < 1e-8) {
    return { x: 0, y: 0, z: 0 }
  }
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function resolveVelocityDirection(
  velocityPreset: VelocityPreset,
  magneticFieldDirection: MagneticFieldDirection = 'up',
): Vec3 {
  switch (velocityPreset) {
    case 'forward':
      return { x: 0, y: 0, z: 1 }
    case 'backward':
      return { x: 0, y: 0, z: -1 }
    case 'up':
      return { x: 0, y: 1, z: 0 }
    case 'down':
      return { x: 0, y: -1, z: 0 }
    case 'angle-30':
    case 'angle-45':
    case 'angle-60': {
      const angleDeg = Number(velocityPreset.replace('angle-', ''))
      const angleRad = toRadians(angleDeg)
      const magneticSign = magneticFieldDirection === 'up' ? 1 : -1
      return {
        x: 0,
        y: magneticSign * Math.cos(angleRad),
        z: Math.sin(angleRad),
      }
    }
  }
}

export function resolveMagneticFieldVector(
  magneticFieldT: number,
  magneticFieldDirection: MagneticFieldDirection = 'up',
): Vec3 {
  return { x: 0, y: magneticFieldDirection === 'up' ? magneticFieldT : -magneticFieldT, z: 0 }
}

export function resolveRodVector(rodLengthM: number, rodAngleDeg: number): Vec3 {
  const angleRad = toRadians(rodAngleDeg)
  return {
    x: Math.sin(angleRad) * rodLengthM,
    y: Math.cos(angleRad) * rodLengthM,
    z: 0,
  }
}

export function deriveMotionalEmfReadings(config: MotionalEmfConfig): MotionalEmfReadings {
  const magneticField = resolveMagneticFieldVector(config.magneticFieldT, config.magneticFieldDirection)
  const velocity = scale(resolveVelocityDirection(config.velocityPreset, config.magneticFieldDirection), config.speedMps)
  const rod = resolveRodVector(config.rodLengthM, config.rodAngleDeg)
  const signedVoltageV = dot(cross(magneticField, velocity), rod)
  const baseProduct = Math.abs(config.magneticFieldT * config.rodLengthM * config.speedMps)

  return {
    signedVoltageV,
    voltageMagnitudeV: Math.abs(signedVoltageV),
    effectiveCuttingRatio: baseProduct > 0 ? Math.abs(signedVoltageV) / baseProduct : 0,
  }
}

export function resolveRodContactOffsets(options: {
  visualRodLength: number
  rodAngleDeg: number
}): ContactOffsetPair {
  const rodVector = resolveRodVector(options.visualRodLength, options.rodAngleDeg)

  return {
    left: [-rodVector.x / 2, -rodVector.y / 2, -rodVector.z / 2],
    right: [rodVector.x / 2, rodVector.y / 2, rodVector.z / 2],
  }
}

export function advanceTravelProgress(options: TravelProgressOptions): number {
  const travelSpan = options.travelSpan ?? DEFAULT_TRAVEL_SPAN
  if (travelSpan <= 0 || options.speedMps <= 0 || options.deltaS <= 0) {
    return clamp(options.previous, 0, 1)
  }

  return clamp(options.previous + (options.deltaS * options.speedMps) / travelSpan, 0, 1)
}

export function advanceMotionOffset(options: {
  previous: MotionOffset
  deltaS: number
  speedMps: number
  velocityPreset: VelocityPreset
  magneticFieldDirection: MagneticFieldDirection
}): MotionOffset {
  const velocityDirection = resolveVelocityDirection(options.velocityPreset, options.magneticFieldDirection)
  const distance = options.deltaS * options.speedMps

  return [
    options.previous[0] + velocityDirection.x * distance,
    options.previous[1] + velocityDirection.y * distance,
    options.previous[2] + velocityDirection.z * distance,
  ]
}

export function resolveTeachingVectorAnchors(rodCenter: MotionOffset): TeachingVectorAnchors {
  return {
    velocity: rodCenter,
    current: rodCenter,
  }
}

export function resolveInducedCurrentDirection(options: {
  rodAngleDeg: number
  velocityPreset: VelocityPreset
  magneticFieldDirection: MagneticFieldDirection
  activeMotion: boolean
}): MotionOffset {
  if (!options.activeMotion) {
    return [0, 0, 0]
  }

  const rodDirection = normalize(resolveRodVector(1, options.rodAngleDeg))
  const velocityDirection = normalize(resolveVelocityDirection(options.velocityPreset, options.magneticFieldDirection))
  const magneticFieldDirection = normalize(resolveMagneticFieldVector(1, options.magneticFieldDirection))
  const emfDirection = cross(velocityDirection, magneticFieldDirection)
  const projection = dot(emfDirection, rodDirection)

  if (Math.abs(projection) < 1e-8) {
    return [0, 0, 0]
  }

  const sign = projection > 0 ? 1 : -1
  return [rodDirection.x * sign, rodDirection.y * sign, rodDirection.z * sign]
}

export function resolveWireCurvePoints(options: {
  start: MotionOffset
  end: MotionOffset
  side: 'left' | 'right'
}): MotionOffset[] {
  const sign = options.side === 'left' ? -1 : 1
  const deltaX = options.end[0] - options.start[0]
  const deltaY = options.end[1] - options.start[1]
  const deltaZ = options.end[2] - options.start[2]
  const distance = Math.hypot(deltaX, deltaY, deltaZ)
  const sagDepth = clamp(distance * 0.16, 0.38, 0.95)
  const sideOffset = clamp(distance * 0.08, 0.14, 0.32)

  return [
    options.start,
    [
      options.start[0] + deltaX * 0.18 + sign * sideOffset,
      options.start[1] - sagDepth * 0.18,
      options.start[2] + deltaZ * 0.16,
    ],
    [
      options.start[0] + deltaX * 0.5 + sign * sideOffset * 0.38,
      Math.min(options.start[1], options.end[1]) - sagDepth,
      options.start[2] + deltaZ * 0.52,
    ],
    [
      options.start[0] + deltaX * 0.82 + sign * sideOffset * 0.18,
      options.end[1] - sagDepth * 0.12,
      options.start[2] + deltaZ * 0.84,
    ],
    options.end,
  ]
}

export function formatVelocityPreset(velocityPreset: VelocityPreset): string {
  return VELOCITY_PRESET_LABELS[velocityPreset]
}

export function formatMagneticFieldDirection(direction: MagneticFieldDirection): string {
  return MAGNETIC_FIELD_DIRECTION_LABELS[direction]
}

export function formatPolarityText(signedVoltageV: number): string {
  if (Math.abs(signedVoltageV) < 1e-9) {
    return '两端等势'
  }
  return signedVoltageV > 0 ? 'A 端高电势' : 'B 端高电势'
}

export function formatRelationText(options: {
  rodAngleDeg: number
  velocityPreset: VelocityPreset
  magneticFieldDirection: MagneticFieldDirection
}): string {
  const velocityText =
    options.velocityPreset === 'up'
      ? options.magneticFieldDirection === 'up'
        ? 'v ∥ B'
        : 'v ∥ B（反向）'
      : options.velocityPreset === 'down'
        ? options.magneticFieldDirection === 'down'
          ? 'v ∥ B'
          : 'v ∥ B（反向）'
        : options.velocityPreset.startsWith('angle-')
          ? `v 与 B 成 ${options.velocityPreset.replace('angle-', '')}°`
          : 'B ⟂ v'
  const rodText = options.rodAngleDeg === 90
    ? 'L ∥ (v × B)'
    : options.rodAngleDeg === 0
      ? 'L ∥ B'
      : `L 与 B 成 ${options.rodAngleDeg}°`
  return `${velocityText}，${rodText}`
}
