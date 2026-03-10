import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useMotionalEmfSceneState } from './useMotionalEmfSceneState'

describe('useMotionalEmfSceneState', () => {
  it('starts static with zero displayed voltage and centered polarity', () => {
    const { result } = renderHook(() => useMotionalEmfSceneState())

    expect(result.current.magneticFieldT).toBe(1)
    expect(result.current.rodLengthM).toBe(0.5)
    expect(result.current.speedMps).toBe(2)
    expect(result.current.rodAngleDeg).toBe(90)
    expect(result.current.velocityPreset).toBe('forward')
    expect(result.current.signedVoltageV).toBeCloseTo(0)
    expect(result.current.polarityText).toBe('两端等势')
    expect(result.current.needleAngleRad).toBeCloseTo(0)
  })

  it('defaults magnetic field upward and flips displayed polarity when the field is reversed', () => {
    const { result } = renderHook(() => useMotionalEmfSceneState())

    expect(result.current.magneticFieldDirection).toBe('up')

    act(() => {
      result.current.toggleRunning()
    })
    expect(result.current.signedVoltageV).toBeGreaterThan(0)

    act(() => {
      result.current.toggleRunning()
    })
    act(() => {
      result.current.setMagneticFieldDirection('down')
    })
    act(() => {
      result.current.toggleRunning()
    })
    expect(result.current.signedVoltageV).toBeLessThan(0)
  })

  it('only shows induced voltage while the rod is actually moving', () => {
    const { result } = renderHook(() => useMotionalEmfSceneState())

    act(() => {
      result.current.toggleRunning()
    })

    expect(result.current.signedVoltageV).toBeGreaterThan(0)
    expect(result.current.polarityText).toBe('A 端高电势')

    act(() => {
      result.current.toggleRunning()
    })

    expect(result.current.signedVoltageV).toBeCloseTo(0)
    expect(result.current.polarityText).toBe('两端等势')
  })

  it('reverses polarity only when the selected reverse motion is playing', () => {
    const { result } = renderHook(() => useMotionalEmfSceneState())

    act(() => {
      result.current.setVelocityPreset('backward')
    })

    expect(result.current.signedVoltageV).toBeCloseTo(0)

    act(() => {
      result.current.toggleRunning()
    })

    expect(result.current.signedVoltageV).toBeLessThan(0)
    expect(result.current.polarityText).toBe('B 端高电势')
  })

  it('resets animation and parameters to defaults', () => {
    const { result } = renderHook(() => useMotionalEmfSceneState())

    act(() => {
      result.current.setMagneticFieldT(1.8)
      result.current.setRodAngleDeg(45)
      result.current.toggleRunning()
      result.current.reset()
    })

    expect(result.current.running).toBe(false)
    expect(result.current.phase).toBe(0)
    expect(result.current.magneticFieldT).toBe(1)
    expect(result.current.rodAngleDeg).toBe(90)
    expect(result.current.velocityPreset).toBe('forward')
    expect(result.current.magneticFieldDirection).toBe('up')
  })
})
