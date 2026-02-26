import { isDoubleTap, isTapGesture, nextTouchMode, type TapPoint, type TouchMode } from './gestureMapper'

const MOVE_THRESHOLD_PX = 14
const MODE_SWITCH_MAX_DURATION_MS = 420

type ActiveTouch = {
  startedAtMs: number
  startX: number
  startY: number
  lastX: number
  lastY: number
}

type GestureSession = {
  startedAtMs: number
  maxTouchCount: number
  moved: boolean
}

export type TouchGestureAction =
  | { type: 'double_tap_reset' }
  | { type: 'mode_switch'; mode: TouchMode }

export type TouchPointerEventLike = Pick<
  PointerEvent,
  'pointerId' | 'pointerType' | 'clientX' | 'clientY' | 'timeStamp'
>

type TouchInteractionKernelOptions = {
  initialMode?: TouchMode
  onAction: (action: TouchGestureAction) => void
}

export type TouchInteractionKernel = {
  onPointerDown: (event: TouchPointerEventLike) => void
  onPointerMove: (event: TouchPointerEventLike) => void
  onPointerUp: (event: TouchPointerEventLike) => void
  onPointerCancel: (event: TouchPointerEventLike) => void
}

function isTouchPointer(event: TouchPointerEventLike): boolean {
  return event.pointerType === 'touch'
}

function movementFromStartPx(touch: ActiveTouch): number {
  return Math.hypot(touch.lastX - touch.startX, touch.lastY - touch.startY)
}

function toTapPoint(event: TouchPointerEventLike): TapPoint {
  return {
    timeMs: event.timeStamp,
    x: event.clientX,
    y: event.clientY,
  }
}

export function createTouchInteractionKernel(options: TouchInteractionKernelOptions): TouchInteractionKernel {
  const activeTouches = new Map<number, ActiveTouch>()
  let gestureSession: GestureSession | null = null
  let lastSingleTap: TapPoint | null = null
  let currentMode: TouchMode = options.initialMode ?? 'inspect'

  function ensureGestureSession(startedAtMs: number): void {
    if (!gestureSession) {
      gestureSession = {
        startedAtMs,
        maxTouchCount: activeTouches.size,
        moved: false,
      }
    }
    gestureSession.maxTouchCount = Math.max(gestureSession.maxTouchCount, activeTouches.size)
  }

  function clearGestureSession(): void {
    gestureSession = null
  }

  function handleSingleTapGesture(event: TouchPointerEventLike, isTap: boolean): void {
    if (!isTap) {
      lastSingleTap = null
      return
    }

    const tapPoint = toTapPoint(event)
    if (lastSingleTap && isDoubleTap({ previous: lastSingleTap, current: tapPoint })) {
      options.onAction({ type: 'double_tap_reset' })
      lastSingleTap = null
      return
    }
    lastSingleTap = tapPoint
  }

  function handleThreeFingerGesture(event: TouchPointerEventLike): void {
    if (!gestureSession) {
      return
    }

    const durationMs = event.timeStamp - gestureSession.startedAtMs
    const canSwitchMode = !gestureSession.moved && durationMs <= MODE_SWITCH_MAX_DURATION_MS
    if (!canSwitchMode) {
      lastSingleTap = null
      return
    }

    currentMode = nextTouchMode(currentMode)
    options.onAction({ type: 'mode_switch', mode: currentMode })
    lastSingleTap = null
  }

  function onPointerDown(event: TouchPointerEventLike): void {
    if (!isTouchPointer(event)) {
      return
    }

    activeTouches.set(event.pointerId, {
      startedAtMs: event.timeStamp,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
    })
    ensureGestureSession(event.timeStamp)
  }

  function onPointerMove(event: TouchPointerEventLike): void {
    if (!isTouchPointer(event)) {
      return
    }

    const touch = activeTouches.get(event.pointerId)
    if (!touch) {
      return
    }
    touch.lastX = event.clientX
    touch.lastY = event.clientY

    if (!gestureSession) {
      return
    }
    if (!gestureSession.moved && movementFromStartPx(touch) > MOVE_THRESHOLD_PX) {
      gestureSession.moved = true
    }
  }

  function onPointerUp(event: TouchPointerEventLike): void {
    if (!isTouchPointer(event)) {
      return
    }

    const touch = activeTouches.get(event.pointerId)
    if (!touch) {
      return
    }

    touch.lastX = event.clientX
    touch.lastY = event.clientY

    const touchDurationMs = event.timeStamp - touch.startedAtMs
    const travelPx = movementFromStartPx(touch)
    const touchIsTap = isTapGesture({ durationMs: touchDurationMs, travelPx })

    activeTouches.delete(event.pointerId)
    if (activeTouches.size > 0) {
      return
    }
    if (!gestureSession) {
      return
    }

    if (gestureSession.maxTouchCount === 3) {
      handleThreeFingerGesture(event)
      clearGestureSession()
      return
    }

    if (gestureSession.maxTouchCount === 1) {
      handleSingleTapGesture(event, touchIsTap && !gestureSession.moved)
      clearGestureSession()
      return
    }

    lastSingleTap = null
    clearGestureSession()
  }

  function onPointerCancel(event: TouchPointerEventLike): void {
    if (!isTouchPointer(event)) {
      return
    }

    activeTouches.delete(event.pointerId)
    if (activeTouches.size > 0) {
      return
    }

    lastSingleTap = null
    clearGestureSession()
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  }
}
