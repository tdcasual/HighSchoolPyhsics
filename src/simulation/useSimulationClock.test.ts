import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../store/useAppStore'
import { useSimulationClock } from './useSimulationClock'

let frames: FrameRequestCallback[] = []
let now = 0

function runFrames(count: number, ms = 16) {
  for (let index = 0; index < count; index++) {
    now += ms
    const pending = frames
    frames = []
    act(() => pending.forEach((callback) => callback(now)))
  }
}

describe('useSimulationClock', () => {
  beforeEach(() => {
    frames = []
    now = 0
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    useAppStore.setState({ playbackRate: 1 })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('advances by real time while running and honours slow motion', () => {
    const advance = vi.fn()
    const { result } = renderHook(() => useSimulationClock({ advance, stepSeconds: 0.5, initiallyRunning: true }))
    runFrames(3)
    expect(advance).toHaveBeenCalledTimes(2)
    expect(advance.mock.calls[0][0]).toBeCloseTo(0.016, 6)
    useAppStore.setState({ playbackRate: 0.25 })
    runFrames(1)
    expect(advance.mock.calls[2][0]).toBeCloseTo(0.004, 6)
    expect(result.current.frameloop).toBe('always')
  })

  it('单步 pauses and advances exactly one step', () => {
    const advance = vi.fn()
    const { result } = renderHook(() => useSimulationClock({ advance, stepSeconds: 0.5, initiallyRunning: true }))
    act(() => result.current.step())
    expect(result.current.running).toBe(false)
    expect(advance).toHaveBeenLastCalledWith(0.5)
    expect(result.current.frameloop).toBe('demand')
  })

  it('caps a long frame and splits fixed sub-steps', () => {
    const advance = vi.fn()
    renderHook(() => useSimulationClock({ advance, stepSeconds: 0.1, initiallyRunning: true, fixedStepSeconds: 0.01 }))
    runFrames(1)
    runFrames(1, 1000)
    // 50 ms cap → five 10 ms sub-steps.
    expect(advance).toHaveBeenCalledTimes(5)
    expect(advance.mock.calls.every(([dt]) => dt === 0.01)).toBe(true)
  })

  it('pauses itself when the process ends', () => {
    const { result } = renderHook(() =>
      useSimulationClock({ advance: () => false, stepSeconds: 0.1, initiallyRunning: true }),
    )
    runFrames(2)
    expect(result.current.running).toBe(false)
  })
})
