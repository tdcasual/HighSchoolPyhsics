import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'day' | 'night'
export type NightTone = 'minimal' | 'neon'

type AppState = {
  theme: ThemeMode
  nightTone: NightTone
  presentationMode: boolean
  setTheme: (theme: ThemeMode) => void
  setNightTone: (nightTone: NightTone) => void
  setPresentationMode: (presentationMode: boolean) => void
}

type BasicStorage = {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

const memoryStorageMap = new Map<string, string>()

const memoryStorage: BasicStorage = {
  getItem: (name) => memoryStorageMap.get(name) ?? null,
  setItem: (name, value) => {
    memoryStorageMap.set(name, value)
  },
  removeItem: (name) => {
    memoryStorageMap.delete(name)
  },
}

function isTestRuntime(): boolean {
  const viteEnv = (import.meta as { env?: Record<string, unknown> }).env
  return Boolean(viteEnv && (viteEnv.MODE === 'test' || viteEnv.VITEST === true))
}

const resolveStorage = (): BasicStorage => {
  if (typeof window === 'undefined' || isTestRuntime()) {
    return memoryStorage
  }

  const storage = window.localStorage as Partial<BasicStorage> | undefined
  if (
    storage &&
    typeof storage.getItem === 'function' &&
    typeof storage.setItem === 'function' &&
    typeof storage.removeItem === 'function'
  ) {
    return storage as BasicStorage
  }

  return memoryStorage
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'day',
      nightTone: 'minimal',
      presentationMode: false,
      setTheme: (theme) => set({ theme }),
      setNightTone: (nightTone) => set({ nightTone }),
      setPresentationMode: (presentationMode) => set({ presentationMode }),
    }),
    {
      name: 'electromagnetics-lab-ui',
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        theme: state.theme,
        nightTone: state.nightTone,
        presentationMode: state.presentationMode,
      }),
    },
  ),
)
