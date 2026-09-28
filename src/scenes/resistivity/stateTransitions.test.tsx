import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useResistivitySceneState } from './useResistivitySceneState'

describe('resistivity scene transitions', () => {
  it('opens the switch and returns to wire setup when an electrical configuration changes', () => {
    const { result } = renderHook(() => useResistivitySceneState())
    act(() => result.current.setStage('circuit'))
    act(() => result.current.setStep(1))
    act(() => result.current.toggleClosed())
    expect(result.current.closed).toBe(false)
    act(() => result.current.setStep(2))
    act(() => result.current.toggleClosed())
    expect(result.current.closed).toBe(true)
    act(() => result.current.setAmmeter('A3'))
    expect(result.current.closed).toBe(false)
    expect(result.current.step).toBe(0)
    act(() => result.current.setStep(2))
    act(() => result.current.toggleClosed())
    expect(result.current.closed).toBe(true)
    act(() => result.current.setLength(35))
    expect(result.current.closed).toBe(false)
    act(() => result.current.setStage('iv'))
    expect(result.current.closed).toBe(false)
  })

  it('keeps the selected voltage inside the active element model range', () => {
    const { result } = renderHook(() => useResistivitySceneState())
    act(() => result.current.setVoltage(2.8))
    act(() => result.current.setElement('diode'))
    expect(result.current.voltage).toBe(0.8)
    act(() => result.current.setVoltage(-1.2))
    expect(result.current.voltage).toBe(-1.2)
    act(() => result.current.setElement('lamp'))
    expect(result.current.voltage).toBe(0)
  })
})
