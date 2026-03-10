import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRotationalEmfSceneState } from './useRotationalEmfSceneState'

describe('useRotationalEmfSceneState', () => {
  it('starts with all teaching defaults equal to 1', () => {
    const { result } = renderHook(() => useRotationalEmfSceneState())

    expect(result.current.scenario).toBe('rod')
    expect(result.current.magneticFieldT).toBe(1)
    expect(result.current.angularSpeed).toBe(1)
    expect(result.current.effectiveLengthM).toBe(1)
    expect(result.current.viewMode).toBe('main')
    expect(result.current.running).toBe(false)
  })

  it('switches scenario and recomputes the readout', () => {
    const { result } = renderHook(() => useRotationalEmfSceneState())

    const first = result.current.emfMagnitudeV

    act(() => {
      result.current.setScenario('frame')
    })

    expect(result.current.scenario).toBe('frame')
    expect(result.current.emfMagnitudeV).not.toBe(first)
  })

  it('switches between main and top view', () => {
    const { result } = renderHook(() => useRotationalEmfSceneState())

    act(() => {
      result.current.setViewMode('top')
    })

    expect(result.current.viewMode).toBe('top')
  })

  it('resets state back to the classroom defaults', () => {
    const { result } = renderHook(() => useRotationalEmfSceneState())

    act(() => {
      result.current.setScenario('frame')
      result.current.setViewMode('top')
      result.current.setMagneticFieldT(2)
      result.current.toggleRunning()
      result.current.reset()
    })

    expect(result.current.scenario).toBe('rod')
    expect(result.current.viewMode).toBe('main')
    expect(result.current.magneticFieldT).toBe(1)
    expect(result.current.running).toBe(false)
  })
})
