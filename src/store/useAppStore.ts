import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'day' | 'night'

type AppState = {
  theme: ThemeMode
  activeScenePath: string
  setTheme: (theme: ThemeMode) => void
  setActiveScenePath: (path: string) => void
}

type PersistedAppState = Pick<AppState, 'theme'>

type BasicStorage = {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

const memoryStorageMap = new Map<string, string>()

const memoryStorage: BasicStorage = {
  getItem: (name) => memoryStorageMap.get(name) ?? null,
  setItem: (name, value) => memoryStorageMap.set(name, value),
  removeItem: (name) => memoryStorageMap.delete(name),
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTestRuntime(): boolean {
  const viteEnv = (import.meta as { env?: Record<string, unknown> }).env
  return Boolean(viteEnv && (viteEnv.MODE === 'test' || viteEnv.VITEST === true))
}

function sanitizeThemeMode(value: unknown, fallback: ThemeMode): ThemeMode {
  return value === 'day' || value === 'night' ? value : fallback
}

function pickPersistedAppState(state: AppState): PersistedAppState {
  return { theme: sanitizeThemeMode(state.theme, 'day') }
}

function sanitizePersistedAppState(value: unknown, fallback: PersistedAppState): PersistedAppState {
  if (!isRecord(value)) return fallback
  return { theme: sanitizeThemeMode(value.theme, fallback.theme) }
}

const resolveStorage = (): BasicStorage => {
  if (typeof window === 'undefined' || isTestRuntime()) return memoryStorage
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
      activeScenePath: '/',
      setTheme: (theme) => set({ theme }),
      setActiveScenePath: (path) => set({ activeScenePath: path }),
    }),
    {
      name: 'electromagnetics-lab-ui',
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({ theme: state.theme }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePersistedAppState(persistedState, pickPersistedAppState(currentState)),
      }),
    },
  ),
)
