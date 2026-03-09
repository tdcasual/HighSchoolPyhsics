import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'day' | 'night'
export type NightTone = 'minimal' | 'neon'
export type PresentationLayoutMode = 'auto' | 'split' | 'viewport'

type AppState = {
  theme: ThemeMode
  nightTone: NightTone
  presentationMode: boolean
  activeScenePath: string
  presentationRouteModes: Partial<Record<string, Exclude<PresentationLayoutMode, 'auto'>>>
  setTheme: (theme: ThemeMode) => void
  setNightTone: (nightTone: NightTone) => void
  setPresentationMode: (presentationMode: boolean) => void
  setActiveScenePath: (path: string) => void
  setPresentationRouteMode: (path: string, mode: PresentationLayoutMode) => void
}

type PersistedAppState = Pick<
  AppState,
  'theme' | 'nightTone' | 'presentationMode' | 'presentationRouteModes'
>

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTestRuntime(): boolean {
  const viteEnv = (import.meta as { env?: Record<string, unknown> }).env
  return Boolean(viteEnv && (viteEnv.MODE === 'test' || viteEnv.VITEST === true))
}

function normalizePersistedRoutePath(path: string): string | null {
  const trimmedPath = path.trim()
  if (!trimmedPath) {
    return null
  }

  if (trimmedPath === '/') {
    return '/'
  }

  const withoutTrailingSlash = trimmedPath.replace(/\/+$/, '') || '/'
  return withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`
}

function sanitizeThemeMode(value: unknown, fallback: ThemeMode): ThemeMode {
  return value === 'day' || value === 'night' ? value : fallback
}

function sanitizeNightTone(value: unknown, fallback: NightTone): NightTone {
  return value === 'minimal' || value === 'neon' ? value : fallback
}

function sanitizePresentationMode(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function sanitizePresentationRouteModes(
  value: unknown,
): Partial<Record<string, Exclude<PresentationLayoutMode, 'auto'>>> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.entries(value).reduce<Partial<Record<string, Exclude<PresentationLayoutMode, 'auto'>>>>(
    (acc, [path, mode]) => {
      const normalizedPath = normalizePersistedRoutePath(path)
      if (!normalizedPath) {
        return acc
      }

      if (mode === 'split' || mode === 'viewport') {
        acc[normalizedPath] = mode
      }
      return acc
    },
    {},
  )
}

function pickPersistedAppState(state: AppState): PersistedAppState {
  return {
    theme: sanitizeThemeMode(state.theme, 'day'),
    nightTone: sanitizeNightTone(state.nightTone, 'minimal'),
    presentationMode: sanitizePresentationMode(state.presentationMode, false),
    presentationRouteModes: sanitizePresentationRouteModes(state.presentationRouteModes),
  }
}

function sanitizePersistedAppState(value: unknown, fallback: PersistedAppState): PersistedAppState {
  if (!isRecord(value)) {
    return fallback
  }

  return {
    theme: sanitizeThemeMode(value.theme, fallback.theme),
    nightTone: sanitizeNightTone(value.nightTone, fallback.nightTone),
    presentationMode: sanitizePresentationMode(value.presentationMode, fallback.presentationMode),
    presentationRouteModes:
      value.presentationRouteModes === undefined
        ? fallback.presentationRouteModes
        : sanitizePresentationRouteModes(value.presentationRouteModes),
  }
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
      activeScenePath: '/',
      presentationRouteModes: {},
      setTheme: (theme) => set({ theme }),
      setNightTone: (nightTone) => set({ nightTone }),
      setPresentationMode: (presentationMode) => set({ presentationMode }),
      setActiveScenePath: (path) => set({ activeScenePath: path }),
      setPresentationRouteMode: (path, mode) =>
        set((state) => {
          const normalized = path || '/'
          const nextModes = { ...sanitizePresentationRouteModes(state.presentationRouteModes) }
          if (mode === 'auto') {
            delete nextModes[normalized]
          } else {
            nextModes[normalized] = mode
          }
          return { presentationRouteModes: nextModes }
        }),
    }),
    {
      name: 'electromagnetics-lab-ui',
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        theme: state.theme,
        nightTone: state.nightTone,
        presentationMode: state.presentationMode,
        presentationRouteModes: state.presentationRouteModes,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePersistedAppState(persistedState, pickPersistedAppState(currentState)),
      }),
    },
  ),
)
