import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAlternatorState, deriveAlternatorReadings, stepAlternatorState } from './model'
import { useAlternatorSceneState } from './useAlternatorSceneState'

function flushAnimationFramesAt(timesMs: number[], queue: FrameRequestCallback[]) {
  timesMs.forEach((timeMs) => {
    const callback = queue.shift()
    if (!callback) {
      return
    }
    callback(timeMs)
  })
}

function advanceReferenceState(stepCount: number) {
  let state = createAlternatorState({ isRunning: true })
  for (let index = 0; index < stepCount; index += 1) {
    state = stepAlternatorState(state)
  }
  return state
}

describe('useAlternatorSceneState', () => {
  let animationQueue: FrameRequestCallback[]

  beforeEach(() => {
    animationQueue = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      animationQueue.push(callback)
      return animationQueue.length
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      const index = id - 1
      if (index >= 0 && index < animationQueue.length) {
        animationQueue.splice(index, 1)
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('advances angle and waveform history from elapsed time, then pauses and resets to stopped state', () => {
    const { result } = renderHook(() => useAlternatorSceneState())

    expect(result.current.angularSpeedRad).toBeGreaterThan(0)
    expect(result.current.running).toBe(true)
    act(() => {
      flushAnimationFramesAt(
        Array.from({ length: 21 }, (_, index) => index * 100),
        animationQueue,
      )
    })

    const expectedAfterTwoSeconds = advanceReferenceState(120)
    const expectedReadings = deriveAlternatorReadings(expectedAfterTwoSeconds)

    expect(result.current.running).toBe(true)
    expect(result.current.frameCount).toBeGreaterThan(100)
    expect(result.current.angleRad).toBeCloseTo(expectedAfterTwoSeconds.angleRad, 1)
    expect(result.current.history.voltage.length).toBeGreaterThan(20)
    expect(result.current.instantaneousVoltageV).toBeCloseTo(expectedReadings.instantaneousVoltageV, 1)

    const pausedAngle = result.current.angleRad

    act(() => {
      result.current.toggleRunning()
    })
    act(() => {
      flushAnimationFramesAt(
        Array.from({ length: 6 }, (_, index) => 2100 + index * 100),
        animationQueue,
      )
    })

    expect(result.current.running).toBe(false)
    expect(result.current.angleRad).toBe(pausedAngle)

    act(() => {
      result.current.reset()
    })

    expect(result.current.angleRad).toBe(0)
    expect(result.current.elapsedTimeS).toBe(0)
    expect(result.current.history.voltage).toEqual([])
    expect(result.current.history.current).toEqual([])
    expect(result.current.running).toBe(false)
  })
})
