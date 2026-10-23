import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useGeneratorCoreSceneState } from '../generator-core/useGeneratorCoreSceneState'
import { useWaveStateSceneState } from '../wave-state/useWaveStateSceneState'
import { useRotationalEmfSceneState } from '../rotational-emf/useRotationalEmfSceneState'
import { useOscilloscope3dSceneState } from '../oscilloscope-3d/useOscilloscope3dSceneState'
import { useWaveInterferenceSceneState } from '../wave-interference/useWaveInterferenceSceneState'

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

describe('单步 actions added for the oscilloscopes and wave interference', () => {
  it('sweeps the 3D oscilloscope beam one division', () => {
    const { result } = renderHook(() => useOscilloscope3dSceneState())
    const before = result.current.elapsed
    act(() => result.current.step())
    expect(result.current.running).toBe(false)
    expect(result.current.elapsed - before).toBeCloseTo(result.current.timeDiv / 1000, 9)
    // The 扫描速度 control speeds the running sweep, not the size of one division.
    act(() => result.current.setBeamSpeed(3))
    const fast = result.current.elapsed
    act(() => result.current.step())
    expect(result.current.elapsed - fast).toBeCloseTo(result.current.timeDiv / 1000, 9)
  })

  it('advances the interference pattern a quarter period of S₁', () => {
    const { result } = renderHook(() => useWaveInterferenceSceneState())
    const before = result.current.time.current
    act(() => result.current.step())
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.frameVersion).toBe(1)
    expect(result.current.time.current - before).toBeCloseTo(
      result.current.wavelength1 / result.current.waveSpeed / 4,
      9,
    )
  })
})
