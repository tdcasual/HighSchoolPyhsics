import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useMotionalEmfSceneState } from './useMotionalEmfSceneState'

describe('useMotionalEmfSceneState', () => {
  it('starts in v-B mode with the original default preset still available', () => {
    const { result } = renderHook(() => useMotionalEmfSceneState())

    expect(result.current.discussionMode).toBe('vb')
    expect(result.current.velocityPreset).toBe('forward')
    expect(result.current.rodVelocityAngleDeg).toBe(90)
    expect(result.current.signedVoltageV).toBeCloseTo(0)
    expect(result.current.angleBetweenBVLabel).toBe('90°')
  })

  it('still supports v parallel B after switching velocity presets in v-B mode', () => {
    const { result } = renderHook(() => useMotionalEmfSceneState())

    act(() => {
      result.current.setVelocityPreset('up')
      result.current.toggleRunning()
    })

    expect(result.current.signedVoltageV).toBeCloseTo(0)
    expect(result.current.angleBetweenBVLabel).toBe('0°')
  })

  it('supports the new L-v mode and updates derived angle readouts there', () => {
    const { result } = renderHook(() => useMotionalEmfSceneState())

    act(() => {
      result.current.setDiscussionMode('lv')
      result.current.setRodAngleDeg(60)
      result.current.setRodVelocityAngleDeg(45)
      result.current.toggleRunning()
    })

    expect(result.current.discussionMode).toBe('lv')
    expect(result.current.angleBetweenBLLabel).toBe('60°')
    expect(result.current.angleBetweenLVLabel).toBe('45°')
    expect(result.current.angleBetweenBVLabel).toBe('69.3°')
    expect(result.current.signedVoltageV).toBeGreaterThan(0)
  })

  it('resets both modes back to the original default classroom state', () => {
    const { result } = renderHook(() => useMotionalEmfSceneState())

    act(() => {
      result.current.setDiscussionMode('lv')
      result.current.setRodVelocityAngleDeg(30)
      result.current.setMotionDirection('backward')
      result.current.reset()
    })

    expect(result.current.discussionMode).toBe('vb')
    expect(result.current.velocityPreset).toBe('forward')
    expect(result.current.rodVelocityAngleDeg).toBe(90)
    expect(result.current.motionDirection).toBe('forward')
  })
})
