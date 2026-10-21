import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { clearSceneMemory, recall, rememberFields, useRemember, useRememberFields } from '../sceneMemory'

/** What a scene does: useState(() => recall(key, default)) plus useRemember on change. */
function remember(pageId: string, name: string, value: unknown) {
  renderHook(() => useRemember(pageId, { [name]: value })).unmount()
}

describe('scene memory', () => {
  it('restores a parameter after the scene unmounts and mounts again', () => {
    expect(recall('mhd.magneticFieldT', 1.5)).toBe(1.5)
    remember('mhd', 'magneticFieldT', 2.4)
    expect(recall('mhd.magneticFieldT', 1.5)).toBe(2.4)
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
    remember('mhd', 'loadOhm', 4)
    remember('oersted', 'currentA', -2)

    clearSceneMemory('mhd')
    expect(recall('mhd.loadOhm', 0.3)).toBe(0.3)
    expect(recall('oersted.currentA', 4)).toBe(-2)
  })
})
