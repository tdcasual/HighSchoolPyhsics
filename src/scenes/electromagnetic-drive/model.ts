export const TARGET_MAGNET_SPEED = 4
export const COUPLING_FACTOR = 0.015
export const FRAME_FRICTION = 0.006
export const FRAME_INERTIA = 2.5
export const MAGNET_ACCELERATION_FACTOR = 0.03
export const MAGNET_DECAY_FACTOR = 0.98
export const ANGLE_STEP_SCALE = 0.05
export const CHART_SAMPLE_INTERVAL = 5
export const MAX_CHART_POINTS = 100

export type ElectromagneticDriveHistory = {
  magnetSpeeds: number[]
  frameSpeeds: number[]
}

export type ElectromagneticDriveState = {
  isRunning: boolean
  magnetSpeed: number
  frameSpeed: number
  magnetAngle: number
  frameAngle: number
  frameCount: number
  history: ElectromagneticDriveHistory
}

function trimHistory(values: number[]): number[] {
  if (values.length <= MAX_CHART_POINTS) {
    return values
  }

  return values.slice(values.length - MAX_CHART_POINTS)
}

export function createElectromagneticDriveState(
  overrides: Partial<ElectromagneticDriveState> = {},
): ElectromagneticDriveState {
  const initialState: ElectromagneticDriveState = {
    isRunning: false,
    magnetSpeed: 0,
    frameSpeed: 0,
    magnetAngle: 0,
    frameAngle: 0,
    frameCount: 0,
    history: {
      magnetSpeeds: [],
      frameSpeeds: [],
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

export function isElectromagneticDriveActive(state: ElectromagneticDriveState): boolean {
  return state.isRunning || state.magnetSpeed > 0.01 || state.frameSpeed > 0.01
}

export function stepElectromagneticDriveState(
  state: ElectromagneticDriveState,
): ElectromagneticDriveState {
  let magnetSpeed = state.magnetSpeed
  if (state.isRunning) {
    magnetSpeed += (TARGET_MAGNET_SPEED - magnetSpeed) * MAGNET_ACCELERATION_FACTOR
  } else {
    magnetSpeed *= MAGNET_DECAY_FACTOR
    if (magnetSpeed < 0.01) {
      magnetSpeed = 0
    }
  }

  const slipSpeed = magnetSpeed - state.frameSpeed
  const magneticTorque = slipSpeed * COUPLING_FACTOR
  const frictionTorque = state.frameSpeed * FRAME_FRICTION
  const angularAcceleration = (magneticTorque - frictionTorque) / FRAME_INERTIA

  let frameSpeed = state.frameSpeed + angularAcceleration
  if (frameSpeed < 0 && magnetSpeed === 0) {
    frameSpeed = 0
  }

  const magnetAngle = state.magnetAngle + magnetSpeed * ANGLE_STEP_SCALE
  const frameAngle = state.frameAngle + frameSpeed * ANGLE_STEP_SCALE
  const nextFrameCount = state.frameCount + 1
  const shouldSample = state.frameCount % CHART_SAMPLE_INTERVAL === 0

  const magnetSpeeds = shouldSample
    ? trimHistory([...state.history.magnetSpeeds, magnetSpeed])
    : state.history.magnetSpeeds
  const frameSpeeds = shouldSample
    ? trimHistory([...state.history.frameSpeeds, frameSpeed])
    : state.history.frameSpeeds

  return {
    ...state,
    magnetSpeed,
    frameSpeed,
    magnetAngle,
    frameAngle,
    frameCount: nextFrameCount,
    history: {
      magnetSpeeds,
      frameSpeeds,
    },
  }
}

export function resetElectromagneticDriveState(
  state?: ElectromagneticDriveState,
): ElectromagneticDriveState {
  void state
  return createElectromagneticDriveState()
}

export function formatAngularSpeed(value: number): string {
  return `${value.toFixed(2)} rad/s`
}

export function formatLagRatio(frameSpeed: number, magnetSpeed: number): string {
  if (magnetSpeed <= 0.001) {
    return '0%'
  }

  const ratio = Math.max(0, frameSpeed / magnetSpeed)
  return `${Math.round(ratio * 100)}%`
}
