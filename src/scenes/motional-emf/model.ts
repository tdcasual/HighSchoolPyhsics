export type DiscussionMode = 'vb' | 'lv'
export type VelocityPreset = 'forward' | 'backward' | 'up' | 'down' | 'angle-30' | 'angle-45' | 'angle-60'
export type MotionDirectionPreset = 'forward' | 'backward'
export type RodVelocityAnglePreset = 90 | 60 | 45 | 30
export type MagneticFieldDirection = 'up' | 'down'

export type MotionalEmfConfig = {
  magneticFieldT: number
  magneticFieldDirection: MagneticFieldDirection
  rodLengthM: number
  speedMps: number
  rodAngleDeg: number
  discussionMode: DiscussionMode
  velocityPreset: VelocityPreset
  rodVelocityAngleDeg: RodVelocityAnglePreset
  motionDirection: MotionDirectionPreset
}

export type MotionalEmfReadings = {
  signedVoltageV: number
  voltageMagnitudeV: number
  effectiveCuttingRatio: number
  angleBetweenBLDeg: number
  angleBetweenLVDeg: number
  angleBetweenBVDeg: number
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
const FORWARD_AXIS: Vec3 = { x: 0, y: 0, z: 1 }

export const DISCUSSION_MODE_LABELS: Record<DiscussionMode, string> = {
  vb: '按 ∠(v,B) 讨论',
  lv: '按 ∠(L,v) 讨论',
}

export const VELOCITY_PRESET_LABELS: Record<VelocityPreset, string> = {
  forward: '前进（标准切割）',
  backward: '后退（反向切割）',
  up: '向上',
  down: '向下',
  'angle-30': '与 B 成 30°',
  'angle-45': '与 B 成 45°',
  'angle-60': '与 B 成 60°',
}

export const MOTION_DIRECTION_LABELS: Record<MotionDirectionPreset, string> = {
  forward: '标准方向',
  backward: '反向运动',
}

export const ROD_VELOCITY_ANGLE_LABELS: Record<RodVelocityAnglePreset, string> = {
  90: 'L 与 v 成 90°',
  60: 'L 与 v 成 60°',
  45: 'L 与 v 成 45°',
  30: 'L 与 v 成 30°',
}

export const MAGNETIC_FIELD_DIRECTION_LABELS: Record<MagneticFieldDirection, string> = {
  up: '向上',
  down: '向下',
}

export const ROD_ANGLE_OPTIONS = [90, 60, 45, 30] as const
export const ROD_VELOCITY_ANGLE_OPTIONS = [90, 60, 45, 30] as const
export const VELOCITY_PRESET_ORDER: VelocityPreset[] = [
  'forward',
  'backward',
  'up',
  'down',
  'angle-30',
  'angle-45',
  'angle-60',
]

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

function add(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
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

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

function angleBetweenVectorsDeg(a: Vec3, b: Vec3): number {
  const normalizedA = normalize(a)
  const normalizedB = normalize(b)
  const lengthProduct = Math.hypot(normalizedA.x, normalizedA.y, normalizedA.z) * Math.hypot(normalizedB.x, normalizedB.y, normalizedB.z)
  if (lengthProduct < 1e-8) {
    return 0
  }

  const cosine = clamp(dot(normalizedA, normalizedB), -1, 1)
  return toDegrees(Math.acos(cosine))
}

function formatAngleDegrees(value: number): string {
  const roundedToTenth = Math.round(value * 10) / 10
  if (Math.abs(roundedToTenth - Math.round(roundedToTenth)) < 1e-8) {
    return `${Math.round(roundedToTenth)}°`
  }
  return `${roundedToTenth.toFixed(1)}°`
}

function resolveVelocityDirectionFromVB(options: {
  velocityPreset: VelocityPreset
  magneticFieldDirection: MagneticFieldDirection
}): Vec3 {
  switch (options.velocityPreset) {
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
      const angleDeg = Number(options.velocityPreset.replace('angle-', ''))
      const angleRad = toRadians(angleDeg)
      const magneticSign = options.magneticFieldDirection === 'up' ? 1 : -1
      return {
        x: 0,
        y: magneticSign * Math.cos(angleRad),
        z: Math.sin(angleRad),
      }
    }
  }
}

function resolveVelocityDirectionFromLV(options: {
  rodAngleDeg: number
  rodVelocityAngleDeg: RodVelocityAnglePreset
  motionDirection: MotionDirectionPreset
}): Vec3 {
  const rodDirection = normalize(resolveRodVector(1, options.rodAngleDeg))
  const angleRad = toRadians(options.rodVelocityAngleDeg)
  const forwardDirection = options.motionDirection === 'forward' ? FORWARD_AXIS : scale(FORWARD_AXIS, -1)

  return normalize(add(scale(rodDirection, Math.cos(angleRad)), scale(forwardDirection, Math.sin(angleRad))))
}

export function resolveVelocityDirection(options: {
  discussionMode: DiscussionMode
  velocityPreset: VelocityPreset
  magneticFieldDirection: MagneticFieldDirection
  rodAngleDeg: number
  rodVelocityAngleDeg: RodVelocityAnglePreset
  motionDirection: MotionDirectionPreset
}): Vec3 {
  return options.discussionMode === 'vb'
    ? resolveVelocityDirectionFromVB({
        velocityPreset: options.velocityPreset,
        magneticFieldDirection: options.magneticFieldDirection,
      })
    : resolveVelocityDirectionFromLV({
        rodAngleDeg: options.rodAngleDeg,
        rodVelocityAngleDeg: options.rodVelocityAngleDeg,
        motionDirection: options.motionDirection,
      })
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
  const velocityDirection = resolveVelocityDirection({
    discussionMode: config.discussionMode,
    velocityPreset: config.velocityPreset,
    magneticFieldDirection: config.magneticFieldDirection,
    rodAngleDeg: config.rodAngleDeg,
    rodVelocityAngleDeg: config.rodVelocityAngleDeg,
    motionDirection: config.motionDirection,
  })
  const velocity = scale(velocityDirection, config.speedMps)
  const rod = resolveRodVector(config.rodLengthM, config.rodAngleDeg)
  const signedVoltageV = dot(cross(magneticField, velocity), rod)
  const baseProduct = Math.abs(config.magneticFieldT * config.rodLengthM * config.speedMps)

  return {
    signedVoltageV,
    voltageMagnitudeV: Math.abs(signedVoltageV),
    effectiveCuttingRatio: baseProduct > 0 ? Math.abs(signedVoltageV) / baseProduct : 0,
    angleBetweenBLDeg: angleBetweenVectorsDeg(magneticField, rod),
    angleBetweenLVDeg: angleBetweenVectorsDeg(rod, velocityDirection),
    angleBetweenBVDeg: angleBetweenVectorsDeg(magneticField, velocityDirection),
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
  discussionMode: DiscussionMode
  velocityPreset: VelocityPreset
  magneticFieldDirection: MagneticFieldDirection
  rodAngleDeg: number
  rodVelocityAngleDeg: RodVelocityAnglePreset
  motionDirection: MotionDirectionPreset
}): MotionOffset {
  const velocityDirection = resolveVelocityDirection(options)
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
  discussionMode: DiscussionMode
  velocityPreset: VelocityPreset
  rodVelocityAngleDeg: RodVelocityAnglePreset
  motionDirection: MotionDirectionPreset
  magneticFieldDirection: MagneticFieldDirection
  activeMotion: boolean
}): MotionOffset {
  if (!options.activeMotion) {
    return [0, 0, 0]
  }

  const rodDirection = normalize(resolveRodVector(1, options.rodAngleDeg))
  const velocityDirection = normalize(resolveVelocityDirection(options))
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

export function formatDiscussionMode(mode: DiscussionMode): string {
  return DISCUSSION_MODE_LABELS[mode]
}

export function formatVelocityPreset(velocityPreset: VelocityPreset): string {
  return VELOCITY_PRESET_LABELS[velocityPreset]
}

export function formatRodVelocityAngle(angle: RodVelocityAnglePreset): string {
  return ROD_VELOCITY_ANGLE_LABELS[angle]
}

export function formatMotionDirection(direction: MotionDirectionPreset): string {
  return MOTION_DIRECTION_LABELS[direction]
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

export function formatRelationText(options: Pick<MotionalEmfReadings, 'angleBetweenBLDeg' | 'angleBetweenLVDeg' | 'angleBetweenBVDeg'>): string {
  return `∠(B,L)=${formatAngleDegrees(options.angleBetweenBLDeg)}，∠(L,v)=${formatAngleDegrees(options.angleBetweenLVDeg)}，∠(B,v)=${formatAngleDegrees(options.angleBetweenBVDeg)}`
}

export function formatAngleLabel(angleDeg: number): string {
  return formatAngleDegrees(angleDeg)
}
