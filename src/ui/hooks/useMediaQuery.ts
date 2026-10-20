import { useSyncExternalStore } from 'react'

export const MOBILE_BREAKPOINT = '(max-width: 767px)'
/** Small desktops and 1366×768 projectors: the panel column would cover much of the 3D view. */
export const COMPACT_DESKTOP_BREAKPOINT = '(min-width: 768px) and (max-width: 1679px)'

const DUMMY_MQL = { matches: false, addEventListener: () => {}, removeEventListener: () => {} }

function getMQL(query: string) {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia(query)
  }
  return DUMMY_MQL
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = getMQL(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    () => getMQL(query).matches,
    () => false,
  )
}
