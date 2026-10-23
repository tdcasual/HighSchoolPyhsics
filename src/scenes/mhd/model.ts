import { deriveMhdLayout, MHD_LAYOUT } from './layout'

type Vec3 = [number, number, number]

type MhdConfig = {
  magneticFieldT: number
  plasmaVelocityMps: number
  electrodeGapM: number
  conductivitySPerM: number
  loadResistanceOhm?: number
  channelAreaM2?: number
}
type ChargeSeparationStep = {
  previous: number
  deltaS: number
  running: boolean
  responseTimeS?: number
  targetWhenRunning?: number
}
type PolarizationTargetConfig = {
  magneticFieldT: number
  plasmaVelocityMps: number
  saturationInducedFieldVPerM?: number
}
type ChannelVisibilityConfig = {
  fluidOpacity: number
  wireframeOpacity: number
  depthWrite: boolean
  channelRenderOrder: number
  particleRenderOrder: number
}

export type MhdReadings = {
  inducedElectricFieldVPerM: number
  openCircuitVoltageV: number
  outputVoltageV: number
  internalResistanceOhm: number
  currentDensityApm2: number
  outputCurrentA: number
  powerDensityWpm3: number
  outputPowerW: number
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}
function deriveInducedFieldAlongElectrodes(magneticFieldT: number, plasmaVelocityMps: number): number {
  const velocity = MHD_LAYOUT.flow.direction.map((part) => part * plasmaVelocityMps) as Vec3
  const magneticField = MHD_LAYOUT.magneticField.direction.map((part) => part * magneticFieldT) as Vec3
  const electricField = cross(velocity, magneticField).map((part) => -part) as Vec3
  const axisLength = Math.hypot(...MHD_LAYOUT.electrodes.axis) || 1
  const axis = MHD_LAYOUT.electrodes.axis.map((part) => part / axisLength) as Vec3
  return dot(electricField, axis)
}

export function deriveMhdReadings(config: MhdConfig): MhdReadings {
  const gap = Math.max(0.000001, config.electrodeGapM)
  const conductivity = Math.max(0.000001, config.conductivitySPerM)
  const area = Math.max(0.000001, config.channelAreaM2 ?? 0.08)
  const loadResistance = Math.max(0.000001, config.loadResistanceOhm ?? 0.3)

  // With +x flow and +z B, -v×B points +y. Since terminal A is the top
  // electrode, U_AB = V_A - V_B is negative.
  const inducedElectricFieldVPerM = deriveInducedFieldAlongElectrodes(config.magneticFieldT, config.plasmaVelocityMps)
  const openCircuitVoltageV = -inducedElectricFieldVPerM * gap
  const internalResistanceOhm = gap / (conductivity * area)
  const outputCurrentA = Math.abs(openCircuitVoltageV) / (internalResistanceOhm + loadResistance)
  const outputVoltageV = (openCircuitVoltageV * loadResistance) / (internalResistanceOhm + loadResistance)
  const currentDensityApm2 = outputCurrentA / area
  const outputPowerW = outputCurrentA ** 2 * loadResistance
  const powerDensityWpm3 = outputPowerW / (gap * area)

  return {
    inducedElectricFieldVPerM,
    openCircuitVoltageV,
    outputVoltageV,
    internalResistanceOhm,
    currentDensityApm2,
    outputCurrentA,
    powerDensityWpm3,
    outputPowerW,
  }
}

export function deriveChargeSeparation(step: ChargeSeparationStep): number {
  const timeConstant = Math.max(0.05, step.responseTimeS ?? 0.8)
  const gain = Math.min(1, Math.max(0, step.deltaS / timeConstant))
  const targetWhenRunning = Math.min(1, Math.max(0, step.targetWhenRunning ?? 1))
  const target = step.running ? targetWhenRunning : 0
  const next = step.previous + (target - step.previous) * gain
  return Math.min(1, Math.max(0, next))
}
export function derivePolarizationTarget(config: PolarizationTargetConfig): number {
  const field = Math.abs(deriveInducedFieldAlongElectrodes(config.magneticFieldT, config.plasmaVelocityMps))
  const saturation = Math.max(1, config.saturationInducedFieldVPerM ?? 6000)
  return Math.min(1, Math.max(0, field / saturation))
}
export function deriveMhdFlowAnimationScale(plasmaVelocityMps: number): number {
  if (!Number.isFinite(plasmaVelocityMps)) return 0
  return Math.max(0, plasmaVelocityMps / 2000)
}

export function deriveCarrierDeflectionAmplitudeY(
  chargeSeparation: number,
  electrodeGapM: number,
  driveRatio: number,
): number {
  const charge = Math.min(1, Math.max(0, Number.isFinite(chargeSeparation) ? chargeSeparation : 0))
  const safeGap = Number.isFinite(electrodeGapM) ? Math.min(1, Math.max(0.1, electrodeGapM)) : 0.4
  const drive = Math.min(1, Math.max(0, Number.isFinite(driveRatio) ? driveRatio : 0))
  const halfGapScene = deriveMhdLayout(safeGap).channel.size[1] / 2
  const carrierClearance = Math.max(0, halfGapScene - 0.048)
  return Math.min(carrierClearance, 0.14 + 0.26 * drive) * charge
}

export function deriveChannelVisibilityConfig(): ChannelVisibilityConfig {
  return {
    fluidOpacity: 0.08,
    wireframeOpacity: 0.26,
    depthWrite: false,
    channelRenderOrder: 0,
    particleRenderOrder: 3,
  }
}
