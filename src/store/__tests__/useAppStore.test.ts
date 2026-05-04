import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createJSONStorage } from 'zustand/middleware'
import { useAppStore } from '../useAppStore'

const STORE_NAME = 'electromagnetics-lab-ui'
const DEFAULT_STATE = {
  theme: 'day' as const,
  activeScenePath: '/',
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

  it('drops invalid persisted theme values during rehydration', async () => {
    await rehydrateFromPersistedState({
      theme: 'sunset',
    })

    expect(useAppStore.getState()).toMatchObject({
      theme: 'day',
      activeScenePath: '/',
    })
  })

  it('accepts valid persisted theme during rehydration', async () => {
    await rehydrateFromPersistedState({
      theme: 'night',
    })

    expect(useAppStore.getState()).toMatchObject({
      theme: 'night',
    })
  })
})

describe('mobilePlaybackActions', () => {
  afterEach(() => {
    useAppStore.setState({ mobilePlaybackActions: [] })
  })

  it('defaults to an empty array', () => {
    expect(useAppStore.getState().mobilePlaybackActions).toEqual([])
  })

  it('updates via setMobilePlaybackActions', () => {
    const actions = [
      { key: 'play', label: '播放', onClick: () => {} },
      { key: 'reset', label: '重置', onClick: () => {}, disabled: true },
    ]
    useAppStore.getState().setMobilePlaybackActions(actions)

    expect(useAppStore.getState().mobilePlaybackActions).toEqual(actions)
  })

  it('is not included in persisted storage', () => {
    useAppStore.getState().setMobilePlaybackActions([
      { key: 'play', label: '播放', onClick: () => {} },
    ])

    const persisted = useAppStore.persist.getOptions().storage?.getItem(STORE_NAME)
    const parsed = typeof persisted === 'string' ? JSON.parse(persisted) : persisted

    expect(parsed?.state?.mobilePlaybackActions).toBeUndefined()
  })
})

describe('sidebarCollapsed', () => {
  afterEach(() => {
    useAppStore.setState({ sidebarCollapsed: false })
  })

  it('defaults to false', () => {
    expect(useAppStore.getState().sidebarCollapsed).toBe(false)
  })

  it('toggles via setSidebarCollapsed', () => {
    useAppStore.getState().setSidebarCollapsed(true)
    expect(useAppStore.getState().sidebarCollapsed).toBe(true)
    useAppStore.getState().setSidebarCollapsed(false)
    expect(useAppStore.getState().sidebarCollapsed).toBe(false)
  })

  it('is not included in persisted storage', () => {
    useAppStore.getState().setSidebarCollapsed(true)
    const persisted = useAppStore.persist.getOptions().storage?.getItem(STORE_NAME)
    const parsed = typeof persisted === 'string' ? JSON.parse(persisted) : persisted
    expect(parsed?.state?.sidebarCollapsed).toBeUndefined()
  })
})
