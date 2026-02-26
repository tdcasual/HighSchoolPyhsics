export type TouchMode = 'inspect' | 'focus'

export type TapGestureSample = {
  durationMs: number
  travelPx: number
}

export type TapPoint = {
  timeMs: number
  x: number
  y: number
}

export type DoubleTapSample = {
  previous: TapPoint
  current: TapPoint
}

const TAP_MAX_DURATION_MS = 280
const TAP_MAX_TRAVEL_PX = 14
const DOUBLE_TAP_MAX_INTERVAL_MS = 320
const DOUBLE_TAP_MAX_DISTANCE_PX = 28

export const TOUCH_MODE_LABELS: Record<TouchMode, string> = {
  inspect: '观察模式',
  focus: '精细模式',
}

export function distancePx(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function isTapGesture(sample: TapGestureSample): boolean {
  return sample.durationMs <= TAP_MAX_DURATION_MS && sample.travelPx <= TAP_MAX_TRAVEL_PX
}

export function isDoubleTap(sample: DoubleTapSample): boolean {
  const intervalMs = sample.current.timeMs - sample.previous.timeMs
  const distance = distancePx(sample.previous, sample.current)
  return intervalMs <= DOUBLE_TAP_MAX_INTERVAL_MS && distance <= DOUBLE_TAP_MAX_DISTANCE_PX
}

export function nextTouchMode(currentMode: TouchMode): TouchMode {
  return currentMode === 'inspect' ? 'focus' : 'inspect'
}
