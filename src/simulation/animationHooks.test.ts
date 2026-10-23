import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../store/useAppStore'
import { useAnimatedState } from './useAnimatedState'
import { useAnimationLoop } from './useAnimationLoop'

let frames = new Map<number, FrameRequestCallback>()
let nextId = 0
let now = 0

function runFrames(count: number, ms = 16) {
  for (let index = 0; index < count; index++) {
    now += ms
    const pending = [...frames.values()]
    frames = new Map()
    act(() => pending.forEach((callback) => callback(now)))
  }
}

beforeEach(() => {
  frames = new Map()
  now = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextId, callback)
    return nextId
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  useAppStore.setState({ playbackRate: 1 })
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAnimationLoop', () => {
  it('runs only while active, with the frame time capped and scaled', () => {
    const onFrame = vi.fn()
    const { rerender } = renderHook(({ active }) => useAnimationLoop(active, onFrame, { timeScale: 2 }), {
      initialProps: { active: false },
    })
    runFrames(3)
    expect(onFrame).not.toHaveBeenCalled()

    rerender({ active: true })
    runFrames(2)
    expect(onFrame).toHaveBeenCalledTimes(1)
    expect(onFrame.mock.calls[0][0]).toBeCloseTo(0.032, 6)

    // A stalled tab does not jump ahead: one frame never integrates more than 0.05 s.
    runFrames(1, 2000)
    expect(onFrame.mock.calls[1][0]).toBeCloseTo(0.1, 6)

    rerender({ active: false })
    runFrames(3)
    expect(onFrame).toHaveBeenCalledTimes(2)
  })

  it('ignores the shell slow motion when asked to', () => {
    const onFrame = vi.fn()
    useAppStore.setState({ playbackRate: 0.25 })
    renderHook(() => useAnimationLoop(true, onFrame, { honourPlaybackRate: false }))
    runFrames(2)
    expect(onFrame.mock.calls[0][0]).toBeCloseTo(0.016, 6)
  })
})

describe('useAnimatedState', () => {
  const fall = (state: { y: number; steps: number }, dt: number) => ({ y: state.y - dt, steps: state.steps + 1 })

  it('steps the state machine while it is active and stops on its own', () => {
    const { result } = renderHook(() => useAnimatedState({ y: 0.04, steps: 0 }, fall, (state) => state.y > 0))
    runFrames(6)
    expect(result.current.state.y).toBeLessThanOrEqual(0)
    const settled = result.current.state.steps
    runFrames(3)
    expect(result.current.state.steps).toBe(settled)

    act(() => result.current.commit(() => ({ y: 0.01, steps: 0 })))
    runFrames(2)
    expect(result.current.state.steps).toBe(1)
  })

  it('spends frames in fixed sub-steps and can drop the carried remainder', () => {
    const { result } = renderHook(() =>
      useAnimatedState({ y: 10, steps: 0 }, fall, () => true, { fixedStepSeconds: 0.01 }),
    )
    runFrames(2) // first frame only sets the clock; second brings 0.016 s → one sub-step, 0.006 carried
    expect(result.current.state.steps).toBe(1)
    runFrames(1, 4) // 0.006 + 0.004 = one more sub-step
    expect(result.current.state.steps).toBe(2)
    runFrames(1, 6)
    act(() => result.current.resetCarry())
    runFrames(1, 6) // without the carried 0.006 this frame is too short for a sub-step
    expect(result.current.state.steps).toBe(2)
  })
})
