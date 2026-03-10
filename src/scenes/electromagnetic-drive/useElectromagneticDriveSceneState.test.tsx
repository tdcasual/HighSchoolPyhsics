import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createElectromagneticDriveState,
  stepElectromagneticDriveState,
} from './model'
import { useElectromagneticDriveSceneState } from './useElectromagneticDriveSceneState'

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
  let state = createElectromagneticDriveState({ isRunning: true })
  for (let index = 0; index < stepCount; index += 1) {
    state = stepElectromagneticDriveState(state)
  }
  return state
}

describe('useElectromagneticDriveSceneState', () => {
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

  it('advances by elapsed time instead of raw raf count, then pauses and resets cleanly', () => {
    const { result } = renderHook(() => useElectromagneticDriveSceneState())

    act(() => {
      result.current.start()
    })
    act(() => {
      flushAnimationFramesAt(
        Array.from({ length: 21 }, (_, index) => index * 100),
        animationQueue,
      )
    })

    const expectedAfterTwoSeconds = advanceReferenceState(120)

    expect(result.current.isRunning).toBe(true)
    expect(result.current.frameCount).toBeGreaterThan(100)
    expect(result.current.magnetSpeed).toBeCloseTo(expectedAfterTwoSeconds.magnetSpeed, 1)
    expect(result.current.frameSpeed).toBeCloseTo(expectedAfterTwoSeconds.frameSpeed, 2)
    expect(result.current.history.magnetSpeeds.length).toBeGreaterThan(20)

    const pausedSpeed = result.current.magnetSpeed

    act(() => {
      result.current.pause()
    })
    act(() => {
      flushAnimationFramesAt(
        Array.from({ length: 6 }, (_, index) => 2100 + index * 100),
        animationQueue,
      )
    })

    expect(result.current.isRunning).toBe(false)
    expect(result.current.magnetSpeed).toBeLessThan(pausedSpeed)

    act(() => {
      result.current.reset()
    })

    expect(result.current.magnetSpeed).toBe(0)
    expect(result.current.frameSpeed).toBe(0)
    expect(result.current.magnetAngle).toBe(0)
    expect(result.current.frameAngle).toBe(0)
    expect(result.current.history.magnetSpeeds).toEqual([])
    expect(result.current.history.frameSpeeds).toEqual([])
  })
})
