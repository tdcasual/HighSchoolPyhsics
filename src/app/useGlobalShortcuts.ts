import { useEffect } from 'react'
import type { DemoRoute } from './demoRoutes'
import type { NightTone, ThemeMode } from '../store/useAppStore'

type UseGlobalShortcutsOptions = {
  routes: DemoRoute[]
  pathname: string
  theme: ThemeMode
  presentationMode: boolean
  setTheme: (theme: ThemeMode) => void
  setNightTone: (nightTone: NightTone) => void
  setPresentationMode: (presentationMode: boolean) => void
  navigateTo: (path: string) => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tagName = target.tagName
  return (
    target.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  )
}

export function useGlobalShortcuts({
  routes,
  pathname,
  theme,
  presentationMode,
  setTheme,
  setNightTone,
  setPresentationMode,
  navigateTo,
}: UseGlobalShortcutsOptions): void {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target)
      ) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === 'd') {
        event.preventDefault()
        setTheme('day')
        return
      }

      if (key === 'n') {
        event.preventDefault()
        setTheme('night')
        return
      }

      if (key === 'm' && theme === 'night') {
        event.preventDefault()
        setNightTone('minimal')
        return
      }

      if (key === 'e' && theme === 'night') {
        event.preventDefault()
        setNightTone('neon')
        return
      }

      if (key === 'p') {
        event.preventDefault()
        setPresentationMode(!presentationMode)
        return
      }

      if (pathname === '/' && /^[1-9]$/.test(key)) {
        const nextRoute = routes[Number(key) - 1]
        if (nextRoute) {
          event.preventDefault()
          void nextRoute.preload()
          navigateTo(nextRoute.path)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    navigateTo,
    pathname,
    presentationMode,
    routes,
    setNightTone,
    setPresentationMode,
    setTheme,
    theme,
  ])
}
