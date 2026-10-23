import { useEffect, useLayoutEffect, useRef } from 'react'
import type { PlaybackAction } from './playbackAction'

/** Space = play/pause; . or → = 单步 (key 'step'); , or ← = step back (key 'step-back'). */
const KEY_ACTIONS: Record<string, 'primary' | 'step' | 'step-back'> = {
  ' ': 'primary',
  '.': 'step',
  ArrowRight: 'step',
  ',': 'step-back',
  ArrowLeft: 'step-back',
}

/** Controls that use the arrow keys themselves. */
const ARROW_KEY_CONTROLS = 'input, select, textarea, [role="slider"], [role="radio"], [role="radiogroup"], [role="tab"]'

const PRIMARY_PLAYBACK_KEYS = new Set(['play', 'toggle-running'])

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true
  return target instanceof HTMLInputElement && !['range', 'checkbox', 'radio', 'button', 'submit'].includes(target.type)
}

/** The playback keys every scene gets, so the teacher never hunts for the button. */
export function usePlaybackShortcuts(playbackActions: PlaybackAction[] | undefined) {
  const actionsRef = useRef(playbackActions)
  useLayoutEffect(() => {
    actionsRef.current = playbackActions
  })

  // A button the teacher just clicked keeps focus and would otherwise re-trigger on Space (e.g.
  // 重置), so pointer-focused controls hand Space to playback too; controls reached with Tab keep
  // their native Space activation.
  useEffect(() => {
    let pointerFocused: Element | null = null
    let lastPointerDown = 0
    const onPointerDown = () => {
      lastPointerDown = performance.now()
    }
    const onFocusIn = (event: FocusEvent) => {
      pointerFocused = performance.now() - lastPointerDown < 600 ? (event.target as Element) : null
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const kind = KEY_ACTIONS[event.key]
      if (!kind || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      // Holding an arrow keeps stepping (fine adjustment); Space and . act once per press.
      if (event.repeat && !event.key.startsWith('Arrow')) return
      const target = event.target
      if (isTextEntry(target)) return
      // Arrow keys belong to a focused slider, radio group or tab list, however it got focus.
      if (event.key.startsWith('Arrow') && target instanceof Element && target.closest(ARROW_KEY_CONTROLS)) return
      if (target instanceof HTMLElement && target !== document.body && target !== pointerFocused) return
      const action = actionsRef.current?.find((candidate) =>
        kind === 'primary' ? PRIMARY_PLAYBACK_KEYS.has(candidate.key) : candidate.key === kind,
      )
      if (!action || action.disabled) return
      event.preventDefault()
      if (target instanceof HTMLElement) target.blur()
      action.onClick()
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
