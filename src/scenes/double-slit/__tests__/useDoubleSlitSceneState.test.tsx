import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDoubleSlitSceneState } from '../useDoubleSlitSceneState'

describe('useDoubleSlitSceneState measurement flow', () => {
  it('records two micrometer positions and calculates wavelength from n bright fringes', () => {
    const { result } = renderHook(() => useDoubleSlitSceneState())

    act(() => result.current.setFringeCount(2))
    act(() => result.current.recordFirstReading())
    act(() => result.current.stepWheel(2.66))
    act(() => result.current.recordSecondReading())
    act(() => result.current.calculateMeasuredWavelength())

    expect(result.current.firstReadingMm).toBe(5.504)
    expect(result.current.secondReadingMm).toBe(8.164)
    expect(result.current.measurementResult?.fringeSpacingMm).toBeCloseTo(2.66, 10)
    expect(result.current.measurementResult?.wavelengthNm).toBeCloseTo(532, 8)
  })

  it('hides monochromatic wavelength for the practice mode and clears the result when inputs change', () => {
    const { result } = renderHook(() => useDoubleSlitSceneState())

    act(() => result.current.recordFirstReading())
    act(() => result.current.stepWheel(2.66))
    act(() => result.current.recordSecondReading())
    act(() => result.current.calculateMeasuredWavelength())
    expect(result.current.measurementResult).not.toBeNull()

    act(() => result.current.setBlindMode(true))
    expect(result.current.isBlindMode).toBe(true)
    expect(result.current.measurementResult).toBeNull()

    act(() => result.current.toggleWhiteLight())
    expect(result.current.isWhiteLight).toBe(true)
    expect(result.current.isBlindMode).toBe(false)
  })

  it('restores the scene, wheel and measurement records on reset', () => {
    const { result } = renderHook(() => useDoubleSlitSceneState())
    act(() => result.current.setWheelReadoutMm(12.345))
    act(() => result.current.recordFirstReading())
    act(() => result.current.reset())

    expect(result.current.wheelReadoutMm).toBe(5.504)
    expect(result.current.firstReadingMm).toBeNull()
    expect(result.current.secondReadingMm).toBeNull()
    expect(result.current.fringeCount).toBe(7)
  })
})
