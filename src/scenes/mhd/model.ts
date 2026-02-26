export type MhdConfig = {
  magneticFieldT: number
  plasmaVelocityMps: number
  electrodeGapM: number
  conductivitySPerM: number
  channelAreaM2?: number
}

export type ChargeSeparationStep = {
  previous: number
  deltaS: number
  running: boolean
  responseTimeS?: number
  targetWhenRunning?: number
}

export type PolarizationTargetConfig = {
  magneticFieldT: number
  plasmaVelocityMps: number
  saturationInducedFieldVPerM?: number
}

export type ChannelVisibilityConfig = {
  fluidOpacity: number
  wireframeOpacity: number
  depthWrite: boolean
  channelRenderOrder: number
  particleRenderOrder: number
}

export type MhdReadings = {
  inducedElectricFieldVPerM: number
  outputVoltageV: number
  currentDensityApm2: number
  outputCurrentA: number
  powerDensityWpm3: number
  outputPowerW: number
}

export function deriveMhdReadings(config: MhdConfig): MhdReadings {
  const magneticField = config.magneticFieldT
  const velocity = config.plasmaVelocityMps
  const gap = config.electrodeGapM
  const conductivity = config.conductivitySPerM
  const area = config.channelAreaM2 ?? 0.08

  const inducedElectricFieldVPerM = velocity * magneticField
  const outputVoltageV = inducedElectricFieldVPerM * gap
  const currentDensityApm2 = conductivity * inducedElectricFieldVPerM
  const outputCurrentA = currentDensityApm2 * area
  const powerDensityWpm3 = currentDensityApm2 * inducedElectricFieldVPerM
  const outputPowerW = outputVoltageV * outputCurrentA

  return {
    inducedElectricFieldVPerM,
    outputVoltageV,
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
  const inducedFieldVPerM = config.magneticFieldT * config.plasmaVelocityMps
  const saturation = Math.max(1, config.saturationInducedFieldVPerM ?? 6000)
  return Math.min(1, Math.max(0, inducedFieldVPerM / saturation))
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
