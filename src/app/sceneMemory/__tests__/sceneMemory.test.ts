import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { clearSceneMemory, rememberFields, useRememberFields, usePersistentState } from '../sceneMemory'

describe('scene memory', () => {
  it('restores a parameter after the scene unmounts and mounts again', () => {
    const first = renderHook(() => usePersistentState('mhd.magneticFieldT', 1.5))
    act(() => first.result.current[1](2.4))
    first.unmount()

    const second = renderHook(() => usePersistentState('mhd.magneticFieldT', 1.5))
    expect(second.result.current[0]).toBe(2.4)
  })

  it('remembers only the listed fields of object state', () => {
    const initial = { amplitude: 50, wavelength: 4, elapsed: 0, running: false }
    const first = renderHook(({ value }) => useRememberFields('wave-state', value, ['amplitude', 'wavelength']), {
      initialProps: { value: initial },
    })
    first.rerender({ value: { ...initial, amplitude: 80, elapsed: 3, running: true } })
    first.unmount()

    expect(rememberFields('wave-state', initial, ['amplitude', 'wavelength'])).toEqual({ ...initial, amplitude: 80 })
  })

  it('forgets one scene without touching the others', () => {
    const a = renderHook(() => usePersistentState('mhd.loadOhm', 0.3))
    act(() => a.result.current[1](4))
    const b = renderHook(() => usePersistentState('oersted.currentA', 4))
    act(() => b.result.current[1](-2))
    a.unmount()
    b.unmount()

    clearSceneMemory('mhd')
    expect(renderHook(() => usePersistentState('mhd.loadOhm', 0.3)).result.current[0]).toBe(0.3)
    expect(renderHook(() => usePersistentState('oersted.currentA', 4)).result.current[0]).toBe(-2)
  })
})
