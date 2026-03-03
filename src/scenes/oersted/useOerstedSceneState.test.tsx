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
})
