import { useSyncExternalStore } from 'react'

export const MOBILE_BREAKPOINT = '(max-width: 767px)'

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
