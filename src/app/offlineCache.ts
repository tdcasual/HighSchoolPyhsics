import { useEffect, useState } from 'react'

/** How often a long-open classroom tab asks the server for a new build. */
const UPDATE_CHECK_MS = 30 * 60 * 1000

/**
 * Registers the build's sw.js (production only), which precaches the whole app for offline use.
 * Open tabs check for a new build every half hour and whenever they become visible again.
 */
export function registerOfflineCache(): void {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(
      (registration) => {
        const check = () => {
          registration.update().catch(() => {})
        }
        window.setInterval(check, UPDATE_CHECK_MS)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check()
        })
      },
      () => {
        // Offline support is a bonus; the app works online without it.
      },
    )
  })
}

/**
 * True once a newer build's service worker has taken over this tab. The page still runs the old
 * build, whose not-yet-loaded scene chunks are gone from the server, so it should be reloaded.
 * The very first install also fires controllerchange; a tab that had no controller is skipped.
 */
export function useAppUpdateReady(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const container = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker
    if (!container?.controller) return
    const onChange = () => setReady(true)
    container.addEventListener('controllerchange', onChange)
    return () => container.removeEventListener('controllerchange', onChange)
  }, [])
  return ready
}

/** True once a service worker is active, i.e. every scene has been cached and works without network. */
export function useOfflineReady(): boolean {
  const [ready, setReady] = useState(
    () => typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker?.controller),
  )
  useEffect(() => {
    if (ready || typeof navigator === 'undefined' || !navigator.serviceWorker) return
    let cancelled = false
    navigator.serviceWorker.ready.then(
      () => {
        if (!cancelled) setReady(true)
      },
      () => {},
    )
    return () => {
      cancelled = true
    }
  }, [ready])
  return ready
}
