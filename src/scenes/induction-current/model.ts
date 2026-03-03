export type PoleSetting = 's-top-n-down' | 's-bottom-n-up'
export type MotionDirection = 'approach' | 'recede'
export type VerticalDirection = 'up' | 'down'
export type FluxChange = 'increase' | 'decrease'
export type CurrentDirection = 'clockwise' | 'counterclockwise'

export type InductionOutcome = {
  originalFieldDirection: VerticalDirection
  fluxChange: FluxChange
  inducedCurrentDirection: CurrentDirection
  inducedFieldDirection: VerticalDirection
  needleSign: 1 | -1
}

export type ExperimentRecord = InductionOutcome & {
  id: number
  poleSetting: PoleSetting
  motion: MotionDirection
}

type DeriveInductionOutcomeOptions = {
  poleSetting: PoleSetting
  motion: MotionDirection
}

type CreateExperimentRecordOptions = DeriveInductionOutcomeOptions & {
  id: number
}

function resolveOriginalFieldDirection(poleSetting: PoleSetting): VerticalDirection {
  return poleSetting === 's-top-n-down' ? 'down' : 'up'
}

function resolveFluxChange(motion: MotionDirection): FluxChange {
  return motion === 'approach' ? 'increase' : 'decrease'
}

function resolveInducedFieldDirection(
  originalFieldDirection: VerticalDirection,
  fluxChange: FluxChange,
): VerticalDirection {
  if (fluxChange === 'increase') {
    return originalFieldDirection === 'up' ? 'down' : 'up'
  }
  return originalFieldDirection
}

function resolveInducedCurrentDirection(
  inducedFieldDirection: VerticalDirection,
): CurrentDirection {
  return inducedFieldDirection === 'up' ? 'counterclockwise' : 'clockwise'
}

function resolveNeedleSign(inducedCurrentDirection: CurrentDirection): 1 | -1 {
  return inducedCurrentDirection === 'counterclockwise' ? 1 : -1
}

export function deriveInductionOutcome(
  options: DeriveInductionOutcomeOptions,
): InductionOutcome {
  const originalFieldDirection = resolveOriginalFieldDirection(options.poleSetting)
  const fluxChange = resolveFluxChange(options.motion)
  const inducedFieldDirection = resolveInducedFieldDirection(
    originalFieldDirection,
    fluxChange,
  )
  const inducedCurrentDirection = resolveInducedCurrentDirection(inducedFieldDirection)

  return {
    originalFieldDirection,
    fluxChange,
    inducedCurrentDirection,
    inducedFieldDirection,
    needleSign: resolveNeedleSign(inducedCurrentDirection),
  }
}

export function createExperimentRecord(
  options: CreateExperimentRecordOptions,
): ExperimentRecord {
  return {
    id: options.id,
    poleSetting: options.poleSetting,
    motion: options.motion,
    ...deriveInductionOutcome(options),
  }
}

export function formatPoleSetting(poleSetting: PoleSetting): string {
  return poleSetting === 's-top-n-down' ? 'S 极在上 (N 下)' : 'S 极在下 (N 上)'
}

export function formatVerticalDirection(direction: VerticalDirection): string {
  return direction === 'up' ? '向上 (↑)' : '向下 (↓)'
}

export function formatFluxChange(fluxChange: FluxChange): string {
  return fluxChange === 'increase' ? '增加 (接近)' : '减少 (远离)'
}

export function formatCurrentDirection(direction: CurrentDirection): string {
  return direction === 'counterclockwise' ? '逆时针' : '顺时针'
}
