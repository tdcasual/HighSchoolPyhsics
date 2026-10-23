import { useEffect } from 'react'
import type { ThemeMode } from '../store/useAppStore'

type UseGlobalShortcutsOptions = {
  pathname: string
  setTheme: (theme: ThemeMode) => void
  onToggleHelp?: () => void
  onToggleLargeText?: () => void
  onTogglePresenting?: () => void
  onExitPresenting?: () => void
  onTogglePredicting?: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName
  return target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
}

export function useGlobalShortcuts({
  pathname,
  setTheme,
  onToggleHelp,
  onToggleLargeText,
  onTogglePresenting,
  onExitPresenting,
  onTogglePredicting,
}: UseGlobalShortcutsOptions): void {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target))
        return

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
      if (key === '?') {
        event.preventDefault()
        onToggleHelp?.()
        return
      }
      if (key === 'l') {
        event.preventDefault()
        onToggleLargeText?.()
        return
      }
      if (key === 'escape') {
        onExitPresenting?.()
        return
      }
      if (key === 'p' && pathname !== '/') {
        event.preventDefault()
        onTogglePresenting?.()
        return
      }
      if (key === 'h' && pathname !== '/') {
        event.preventDefault()
        onTogglePredicting?.()
        return
      }
      // 1–9 and / on the overview are handled by NavigationPage, which knows the current view.
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onExitPresenting, onToggleHelp, onToggleLargeText, onTogglePredicting, onTogglePresenting, pathname, setTheme])
}
