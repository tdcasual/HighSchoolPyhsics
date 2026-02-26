import { describe, expect, it } from 'vitest'
import { isDoubleTap, isTapGesture, nextTouchMode, TOUCH_MODE_LABELS } from '../gestureMapper'

describe('gesture mapper', () => {
  it('recognizes a stable short contact as tap gesture', () => {
    expect(isTapGesture({
      durationMs: 120,
      travelPx: 6,
    })).toBe(true)
  })

  it('rejects long travel as tap gesture', () => {
    expect(isTapGesture({
      durationMs: 120,
      travelPx: 22,
    })).toBe(false)
  })

  it('detects double tap when interval and distance are close', () => {
    expect(isDoubleTap({
      previous: {
        timeMs: 100,
        x: 20,
        y: 20,
      },
      current: {
        timeMs: 330,
        x: 32,
        y: 26,
      },
    })).toBe(true)
  })

  it('toggles touch mode in a two-state cycle', () => {
    expect(nextTouchMode('inspect')).toBe('focus')
    expect(nextTouchMode('focus')).toBe('inspect')
    expect(TOUCH_MODE_LABELS.inspect).toBeTruthy()
    expect(TOUCH_MODE_LABELS.focus).toBeTruthy()
  })
})
