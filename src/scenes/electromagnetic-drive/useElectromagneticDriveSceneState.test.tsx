import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useElectromagneticDriveSceneState } from './useElectromagneticDriveSceneState'

function flushAnimationFrames(count: number, queue: FrameRequestCallback[]) {
  for (let index = 0; index < count; index += 1) {
    const callback = queue.shift()
    if (!callback) {
      return
    }
    callback(index * 16.67)
  }
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

  it('starts the simulation, accumulates chart history, and resets cleanly', () => {
    const { result } = renderHook(() => useElectromagneticDriveSceneState())

    act(() => {
      result.current.start()
    })
    act(() => {
      flushAnimationFrames(18, animationQueue)
    })

    expect(result.current.isRunning).toBe(true)
    expect(result.current.magnetSpeed).toBeGreaterThan(0)
    expect(result.current.frameSpeed).toBeGreaterThanOrEqual(0)
    expect(result.current.history.magnetSpeeds.length).toBeGreaterThan(0)

    act(() => {
      result.current.pause()
    })
    act(() => {
      flushAnimationFrames(40, animationQueue)
    })

    expect(result.current.isRunning).toBe(false)
    expect(result.current.magnetSpeed).toBeLessThan(4)

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
