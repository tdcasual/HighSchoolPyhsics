import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OERSTED_PRESETS } from './oerstedPresets'
import { useOerstedSceneState } from './useOerstedSceneState'

describe('useOerstedSceneState', () => {
  it('applies preset and keeps reset behavior unchanged', () => {
    const { result } = renderHook(() => useOerstedSceneState())
    const favorable = OERSTED_PRESETS.find((preset) => preset.id === 'favorable')
    expect(favorable).toBeDefined()

    act(() => {
      result.current.applyPreset(favorable!)
    })

    expect(result.current.currentA).toBe(8)
    expect(result.current.activePresetId).toBe('favorable')

    act(() => {
      result.current.toggleRunning()
    })
    expect(result.current.running).toBe(true)

    act(() => {
      result.current.resetNeedles()
    })

    expect(result.current.running).toBe(false)
    expect(result.current.initialHeadingDeg).toBe(0)
    expect(result.current.activePresetId).toBe('custom')
    expect(result.current.currentA).toBe(8)
  })

  it('returns the needle to geographic north after power is turned off', async () => {
    const { result } = renderHook(() => useOerstedSceneState())

    act(() => {
      result.current.toggleRunning()
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 900))
    })

    const poweredHeading = result.current.visualNeedles[0]?.headingDeg ?? 0
    expect(Math.min(poweredHeading, 360 - poweredHeading)).toBeGreaterThan(5)

    act(() => {
      result.current.toggleRunning()
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1600))
    })

    const offHeading = result.current.visualNeedles[0]?.headingDeg ?? 0
    expect(Math.min(offHeading, 360 - offHeading)).toBeLessThan(0.1)
  })

})
