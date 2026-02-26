import { describe, expect, it } from 'vitest'
import { createTouchInteractionKernel } from '../touchInteractionKernel'
import type { TouchGestureAction, TouchPointerEventLike } from '../touchInteractionKernel'

function touchEvent(
  pointerId: number,
  timeMs: number,
  x: number,
  y: number,
): TouchPointerEventLike {
  return {
    pointerId,
    pointerType: 'touch',
    clientX: x,
    clientY: y,
    timeStamp: timeMs,
  }
}

function mouseEvent(pointerId: number, timeMs: number): TouchPointerEventLike {
  return {
    pointerId,
    pointerType: 'mouse',
    clientX: 0,
    clientY: 0,
    timeStamp: timeMs,
  }
}

describe('touch interaction kernel', () => {
  it('emits reset action on double tap', () => {
    const actions: TouchGestureAction[] = []
    const kernel = createTouchInteractionKernel({
      onAction: (action) => actions.push(action),
    })

    kernel.onPointerDown(touchEvent(1, 100, 40, 40))
    kernel.onPointerUp(touchEvent(1, 180, 42, 41))

    kernel.onPointerDown(touchEvent(2, 300, 45, 43))
    kernel.onPointerUp(touchEvent(2, 360, 46, 44))

    expect(actions).toEqual([{ type: 'double_tap_reset' }])
  })

  it('emits mode switch action on static three-finger tap', () => {
    const actions: TouchGestureAction[] = []
    const kernel = createTouchInteractionKernel({
      onAction: (action) => actions.push(action),
      initialMode: 'inspect',
    })

    kernel.onPointerDown(touchEvent(1, 0, 10, 10))
    kernel.onPointerDown(touchEvent(2, 10, 30, 10))
    kernel.onPointerDown(touchEvent(3, 20, 20, 25))

    kernel.onPointerUp(touchEvent(1, 90, 10, 10))
    kernel.onPointerUp(touchEvent(2, 100, 30, 10))
    kernel.onPointerUp(touchEvent(3, 110, 20, 25))

    expect(actions).toEqual([{ type: 'mode_switch', mode: 'focus' }])
  })

  it('ignores non-touch pointer streams', () => {
    const actions: TouchGestureAction[] = []
    const kernel = createTouchInteractionKernel({
      onAction: (action) => actions.push(action),
    })

    kernel.onPointerDown(mouseEvent(1, 0))
    kernel.onPointerUp(mouseEvent(1, 40))

    expect(actions).toEqual([])
  })
})
