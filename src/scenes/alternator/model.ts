export const MAX_CHART_POINTS = 160
export const CHART_SAMPLE_INTERVAL = 2
export const FIXED_STEP_S = 1 / 60
export const MAX_METER_NEEDLE_RAD = Math.PI / 3
export const METER_FULL_SCALE_A = 2
const TAU = Math.PI * 2

export type AlternatorConfig = {
  magneticFieldT: number
  angularSpeedRad: number
  turnCount: number
  coilAreaM2: number
  loadResistanceOhm: number
  angleRad: number
}

export type AlternatorReadings = {
  peakVoltageV: number
  fluxWb: number
  instantaneousVoltageV: number
  instantaneousCurrentA: number
  frequencyHz: number
  currentDirectionLabel: string
  meterNeedleAngleRad: number
}

export type AlternatorHistory = {
  voltage: number[]
  current: number[]
}

export type AlternatorState = AlternatorConfig & {
  isRunning: boolean
  elapsedTimeS: number
  frameCount: number
  history: AlternatorHistory
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeAngleRad(angleRad: number) {
  return ((angleRad % TAU) + TAU) % TAU
}

function trimHistory(values: number[]) {
  if (values.length <= MAX_CHART_POINTS) {
    return values
  }

  return values.slice(values.length - MAX_CHART_POINTS)
}

export function deriveAlternatorReadings(config: AlternatorConfig): AlternatorReadings {
  const peakVoltageV = config.magneticFieldT * config.turnCount * config.coilAreaM2 * config.angularSpeedRad
  const fluxWb = config.magneticFieldT * config.turnCount * config.coilAreaM2 * Math.cos(config.angleRad)
  const instantaneousVoltageV = peakVoltageV * Math.sin(config.angleRad)
  const instantaneousCurrentA = config.loadResistanceOhm > 0
    ? instantaneousVoltageV / config.loadResistanceOhm
    : 0
  const frequencyHz = config.angularSpeedRad / TAU
  const meterNeedleAngleRad = clamp(
    instantaneousCurrentA / METER_FULL_SCALE_A,
    -1,
    1,
  ) * MAX_METER_NEEDLE_RAD

  return {
    peakVoltageV,
    fluxWb,
    instantaneousVoltageV,
    instantaneousCurrentA,
    frequencyHz,
    currentDirectionLabel: formatCurrentDirectionLabel(instantaneousCurrentA),
    meterNeedleAngleRad,
  }
}

export function createAlternatorState(overrides: Partial<AlternatorState> = {}): AlternatorState {
  const initialState: AlternatorState = {
    magneticFieldT: 1.1,
    angularSpeedRad: 4.5,
    turnCount: 16,
    coilAreaM2: 0.18,
    loadResistanceOhm: 8,
    angleRad: 0,
    isRunning: true,
    elapsedTimeS: 0,
    frameCount: 0,
    history: {
      voltage: [],
      current: [],
    },
  }

  return {
    ...initialState,
    ...overrides,
    history: {
      ...initialState.history,
      ...overrides.history,
    },
  }
}

export function stepAlternatorState(
  state: AlternatorState,
  deltaS: number = FIXED_STEP_S,
): AlternatorState {
  if (!state.isRunning) {
    return state
  }

  const nextAngleRad = normalizeAngleRad(state.angleRad + state.angularSpeedRad * deltaS)
  const nextFrameCount = state.frameCount + 1
  const nextElapsedTimeS = state.elapsedTimeS + deltaS
  const nextReadings = deriveAlternatorReadings({
    magneticFieldT: state.magneticFieldT,
    angularSpeedRad: state.angularSpeedRad,
    turnCount: state.turnCount,
    coilAreaM2: state.coilAreaM2,
    loadResistanceOhm: state.loadResistanceOhm,
    angleRad: nextAngleRad,
  })
  const shouldSample = nextFrameCount % CHART_SAMPLE_INTERVAL === 0

  return {
    ...state,
    angleRad: nextAngleRad,
    elapsedTimeS: nextElapsedTimeS,
    frameCount: nextFrameCount,
    history: {
      voltage: shouldSample
        ? trimHistory([...state.history.voltage, nextReadings.instantaneousVoltageV])
        : state.history.voltage,
      current: shouldSample
        ? trimHistory([...state.history.current, nextReadings.instantaneousCurrentA])
        : state.history.current,
    },
  }
}

export function resetAlternatorState(state?: AlternatorState): AlternatorState {
  void state
  return createAlternatorState()
}

export function formatCurrentDirectionLabel(currentA: number) {
  if (Math.abs(currentA) < 0.01) {
    return '瞬时为零'
  }

  return currentA > 0 ? 'A → B' : 'B → A'
}

export function formatVoltageLabel(voltageV: number) {
  return `${voltageV.toFixed(2)} V`
}

export function formatCurrentLabel(currentA: number) {
  return `${currentA.toFixed(2)} A`
}

export function formatFrequencyLabel(frequencyHz: number) {
  return `${frequencyHz.toFixed(2)} Hz`
}

export function formatSpeedLabel(angularSpeedRad: number) {
  return `${angularSpeedRad.toFixed(2)} rad/s`
}

export function formatAngleLabel(angleRad: number) {
  return `${Math.round((normalizeAngleRad(angleRad) * 180) / Math.PI)}°`
}

export function formatFluxLabel(fluxWb: number) {
  return `${fluxWb.toFixed(2)} Wb`
}

export function formatNeedleAngleLabel(angleRad: number) {
  return `${Math.round((angleRad * 180) / Math.PI)}°`
}

export function formatTurnsLabel(turnCount: number) {
  return `${turnCount} 匝`
}

export function formatAreaLabel(areaM2: number) {
  return `${areaM2.toFixed(2)} m²`
}
