export const DEFAULT_WHEEL_ZOOM_INTENT_WINDOW_MS = 1800

type WheelZoomIntentInput = {
  wheelZoomIntentGuard: boolean
  eventTrusted: boolean
  lastPointerIntentAtMs: number | null
  nowMs: number
  intentWindowMs?: number
}

export function shouldAllowWheelZoom({
  wheelZoomIntentGuard,
  eventTrusted,
  lastPointerIntentAtMs,
  nowMs,
  intentWindowMs = DEFAULT_WHEEL_ZOOM_INTENT_WINDOW_MS,
}: WheelZoomIntentInput): boolean {
  if (!wheelZoomIntentGuard) {
    return true
  }

  if (!eventTrusted || lastPointerIntentAtMs === null) {
    return false
  }

  return nowMs - lastPointerIntentAtMs <= intentWindowMs
}
