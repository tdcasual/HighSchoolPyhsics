import { useEffect, useState } from 'react'

/** Registers the build's sw.js (production only), which precaches the whole app for offline use. */
export function registerOfflineCache(): void {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Offline support is a bonus; the app works online without it.
    })
  })
}

/** True once a service worker is active, i.e. every scene has been cached and works without network. */
export function useOfflineReady(): boolean {
  const [ready, setReady] = useState(() => typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker?.controller))
  useEffect(() => {
    if (ready || typeof navigator === 'undefined' || !navigator.serviceWorker) return
    let cancelled = false
    navigator.serviceWorker.ready.then(() => {
      if (!cancelled) setReady(true)
    }, () => {})
    return () => {
      cancelled = true
    }
  }, [ready])
  return ready
}
