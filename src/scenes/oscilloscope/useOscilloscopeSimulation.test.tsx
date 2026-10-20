import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { clampTimeRate, useOscilloscopeSimulation } from './useOscilloscopeSimulation'

describe('oscilloscope clock', () => {
  it('单步 advances the time cursor by one step regardless of the playback rate', () => {
    const { result } = renderHook(() => useOscilloscopeSimulation(3, 0.05))
    act(() => result.current.clock.step())
    act(() => result.current.clock.step())
    expect(result.current.timeS).toBeCloseTo(0.1)
    expect(result.current.clock.running).toBe(false)
    act(() => result.current.reset())
    expect(result.current.timeS).toBe(0)
  })

  it('bounds invalid or excessive playback rates', () => {
    expect(clampTimeRate(99)).toBe(3)
    expect(clampTimeRate(0)).toBe(0.05)
    expect(clampTimeRate(Number.NaN)).toBe(1)
  })
})
