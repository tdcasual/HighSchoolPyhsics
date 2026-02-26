import { create } from 'zustand'

export type ThemeMode = 'day' | 'night'

type AppState = {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'day',
  setTheme: (theme) => set({ theme }),
}))
