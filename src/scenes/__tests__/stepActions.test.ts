import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useGeneratorCoreSceneState } from '../generator-core/useGeneratorCoreSceneState'
import { useWaveStateSceneState } from '../wave-state/useWaveStateSceneState'
import { useRotationalEmfSceneState } from '../rotational-emf/useRotationalEmfSceneState'

describe('单步 actions', () => {
  it('turns the generator coil 15° and pauses', () => {
    const { result } = renderHook(() => useGeneratorCoreSceneState())
    const before = result.current.angleRad
    act(() => result.current.step())
    expect(result.current.running).toBe(false)
    expect(result.current.angleRad - before).toBeCloseTo(Math.PI / 12, 6)
  })

  it('turns the rotating rod 15° and pauses', () => {
    const { result } = renderHook(() => useRotationalEmfSceneState())
    const before = result.current.angleRad
    act(() => result.current.step())
    expect(result.current.angleRad - before).toBeCloseTo(Math.PI / 12, 6)
  })

  it('advances the wave a quarter period', () => {
    const { result } = renderHook(() => useWaveStateSceneState())
    const before = result.current.elapsed
    act(() => result.current.step())
    expect(result.current.running).toBe(false)
    expect(result.current.elapsed - before).toBeCloseTo(result.current.period / 4, 6)
  })
})
