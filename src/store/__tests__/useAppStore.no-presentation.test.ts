import { describe, expect, it } from 'vitest'
import { useAppStore } from '../useAppStore'

describe('useAppStore has no presentation or night-tone state', () => {
  const removedKeys: string[] = [
    'presentationMode',
    'presentationRouteModes',
    'nightTone',
    'setPresentationMode',
    'setPresentationRouteMode',
    'setNightTone',
  ]

  it('does not contain any removed keys in store state', () => {
    const state = useAppStore.getState()

    for (const key of removedKeys) {
      expect(key in state, `expected "${key}" to be absent from store state`).toBe(false)
    }
  })

  it('still exposes theme and activeScenePath with their setters', () => {
    const state = useAppStore.getState()

    expect(state).toHaveProperty('theme')
    expect(state).toHaveProperty('activeScenePath')
    expect(state).toHaveProperty('setTheme')
    expect(state).toHaveProperty('setActiveScenePath')
    expect(typeof state.setTheme).toBe('function')
    expect(typeof state.setActiveScenePath).toBe('function')
  })
})
