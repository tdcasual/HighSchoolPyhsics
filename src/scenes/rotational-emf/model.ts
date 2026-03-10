export type RotationalEmfScenario = 'rod' | 'frame'
export type RotationalEmfViewMode = 'main' | 'top'

export type RotationalEmfInputs = {
  magneticFieldT: number
  angularSpeed: number
  effectiveLengthM: number
  angleRad: number
}

export type RotationalEmfReadout = {
  emfMagnitudeV: number
}

export const ROTATIONAL_EMF_SCENARIO_LABELS: Record<RotationalEmfScenario, string> = {
  rod: '旋转导体棒',
  frame: '旋转矩形线框',
}

export const ROTATIONAL_EMF_VIEW_LABELS: Record<RotationalEmfViewMode, string> = {
  main: '主视图',
  top: '俯视图',
}

export function deriveRotatingRodEmfMagnitude(inputs: RotationalEmfInputs): number {
  return Math.abs(
    0.5 * inputs.magneticFieldT * inputs.angularSpeed * inputs.effectiveLengthM * inputs.effectiveLengthM,
  )
}

export function deriveRotatingFrameEmfMagnitude(inputs: RotationalEmfInputs): number {
  return Math.abs(
    inputs.magneticFieldT * inputs.angularSpeed * inputs.effectiveLengthM * inputs.effectiveLengthM * Math.sin(inputs.angleRad),
  )
}

export function deriveRotationalEmfReadout(
  inputs: RotationalEmfInputs & { scenario: RotationalEmfScenario },
): RotationalEmfReadout {
  const emfMagnitudeV = inputs.scenario === 'rod'
    ? deriveRotatingRodEmfMagnitude(inputs)
    : deriveRotatingFrameEmfMagnitude(inputs)

  return { emfMagnitudeV }
}

export function formatAngleDegrees(angleRad: number): string {
  return `${Math.round((angleRad * 180) / Math.PI)}°`
}

export function formatEmfMagnitude(emfMagnitudeV: number): string {
  return `${emfMagnitudeV.toFixed(2)} V`
}
