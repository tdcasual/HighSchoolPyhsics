import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'day' | 'night'

export type MobilePlaybackAction = {
  key: string
  label: string
  onClick: () => void
  disabled?: boolean
}

type AppState = {
  theme: ThemeMode
  activeScenePath: string
  mobilePlaybackActions: MobilePlaybackAction[]
  sidebarCollapsed: boolean
  /** Classroom projection text scale for readouts, charts and 3D labels. */
  largeText: boolean
  /** Lecture mode: only the 3D view is shown, fullscreen. Never persisted. */
  presenting: boolean
  /** Prediction mode: readings marked as conclusions are masked until revealed. */
  predicting: boolean
  /** Slow motion for scenes that opt into the shared time control; reset per scene. */
  playbackRate: number
  setTheme: (theme: ThemeMode) => void
  setActiveScenePath: (path: string) => void
  setMobilePlaybackActions: (actions: MobilePlaybackAction[]) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setLargeText: (largeText: boolean) => void
  setPresenting: (presenting: boolean) => void
  setPredicting: (predicting: boolean) => void
  setPlaybackRate: (playbackRate: number) => void
}

type PersistedAppState = Pick<AppState, 'theme' | 'largeText'>

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
  return { theme: sanitizeThemeMode(state.theme, 'day'), largeText: state.largeText !== false }
}

function sanitizePersistedAppState(value: unknown, fallback: PersistedAppState): PersistedAppState {
  if (!isRecord(value)) return fallback
  return {
    theme: sanitizeThemeMode(value.theme, fallback.theme),
    largeText: typeof value.largeText === 'boolean' ? value.largeText : fallback.largeText,
  }
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
      mobilePlaybackActions: [],
      sidebarCollapsed: false,
      largeText: true,
      presenting: false,
      predicting: false,
      playbackRate: 1,
      setTheme: (theme) => set({ theme }),
      setActiveScenePath: (path) => set({ activeScenePath: path }),
      setMobilePlaybackActions: (actions) => set({ mobilePlaybackActions: actions }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setLargeText: (largeText) => set({ largeText }),
      setPresenting: (presenting) => set({ presenting }),
      setPredicting: (predicting) => set({ predicting }),
      setPlaybackRate: (playbackRate) => set({ playbackRate }),
    }),
    {
      name: 'electromagnetics-lab-ui',
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({ theme: state.theme, largeText: state.largeText }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePersistedAppState(persistedState, pickPersistedAppState(currentState)),
      }),
    },
  ),
)
