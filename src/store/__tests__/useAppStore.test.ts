import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createJSONStorage } from 'zustand/middleware'
import { useAppStore } from '../useAppStore'

const STORE_NAME = 'electromagnetics-lab-ui'
const DEFAULT_STATE = {
  theme: 'day' as const,
  nightTone: 'minimal' as const,
  presentationMode: false,
  activeScenePath: '/',
  presentationRouteModes: {},
}

function createMemoryJsonStorage(initialEntries: Record<string, string> = {}) {
  const storageMap = new Map(Object.entries(initialEntries))

  return {
    getItem: (name: string) => storageMap.get(name) ?? null,
    setItem: (name: string, value: string) => {
      storageMap.set(name, value)
    },
    removeItem: (name: string) => {
      storageMap.delete(name)
    },
  }
}

const originalStorage = useAppStore.persist.getOptions().storage

async function rehydrateFromPersistedState(state: unknown): Promise<void> {
  const storage = createMemoryJsonStorage({
    [STORE_NAME]: JSON.stringify({ state, version: 0 }),
  })

  useAppStore.persist.setOptions({
    storage: createJSONStorage(() => storage),
  })

  await useAppStore.persist.rehydrate()
}

describe('app store persisted state sanitization', () => {
  beforeEach(() => {
    useAppStore.setState(DEFAULT_STATE)
    useAppStore.persist.clearStorage()
  })

  afterEach(() => {
    useAppStore.persist.setOptions({ storage: originalStorage })
    useAppStore.persist.clearStorage()
    useAppStore.setState(DEFAULT_STATE)
  })

  it('sanitizes malformed persisted presentation route modes during rehydration', async () => {
    await rehydrateFromPersistedState({
      theme: 'day',
      nightTone: 'minimal',
      presentationMode: false,
      presentationRouteModes: null,
    })

    expect(useAppStore.getState().presentationRouteModes).toEqual({})
    expect(() => useAppStore.getState().setPresentationRouteMode('/cyclotron', 'viewport')).not.toThrow()
    expect(useAppStore.getState().presentationRouteModes).toEqual({
      '/cyclotron': 'viewport',
    })
  })

  it('drops invalid persisted theme and layout override values during rehydration', async () => {
    await rehydrateFromPersistedState({
      theme: 'sunset',
      nightTone: 'aurora',
      presentationMode: 'yes',
      presentationRouteModes: {
        '/cyclotron': 'viewport',
        '/oersted': 'split',
        '/mhd': 'auto',
        '/oscilloscope': 42,
        '': 'viewport',
      },
    })

    expect(useAppStore.getState()).toMatchObject({
      theme: 'day',
      nightTone: 'minimal',
      presentationMode: false,
      presentationRouteModes: {
        '/cyclotron': 'viewport',
        '/oersted': 'split',
      },
    })
  })
})
