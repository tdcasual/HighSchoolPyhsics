import { useEffect, useState, type RefObject } from 'react'
import type { ScreenRect } from './framing'

export type ViewportSize = { left: number; width: number; height: number }

/** Tracks the canvas element's on-screen box so camera framing can avoid floating panels. */
export function useViewportSize(ref: RefObject<HTMLDivElement | null>): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({ left: 0, width: 1280, height: 720 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => {
      const rect = element.getBoundingClientRect()
      const width = rect.width || window.innerWidth
      const height = rect.height || window.innerHeight
      const left = rect.left
      setSize((previous) =>
        Math.abs(previous.left - left) < 1 &&
        Math.abs(previous.width - width) < 1 &&
        Math.abs(previous.height - height) < 1
          ? previous
          : { left, width, height },
      )
    }

    update()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    observer?.observe(element)
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [ref])

  return size
}

const OVERLAY_SELECTOR = '.sidebar-panel, .floating-panel, .interaction-hint'

function sameRects(a: ScreenRect[], b: ScreenRect[]): boolean {
  return a.length === b.length && a.every((rect, index) => {
    const other = b[index]
    return Math.abs(rect.left - other.left) < 4 && Math.abs(rect.top - other.top) < 4 &&
      Math.abs(rect.right - other.right) < 4 && Math.abs(rect.bottom - other.bottom) < 4
  })
}

/**
 * Tracks where the sidebar, floating panels and gesture hint sit over the canvas, so the
 * camera can frame the instrument in the largest uncovered area. Re-measures when a panel
 * opens, closes, collapses or resizes, and after a panel drag ends (pointerup).
 */
export function useOverlayObstacles(ref: RefObject<HTMLDivElement | null>): ScreenRect[] {
  const [obstacles, setObstacles] = useState<ScreenRect[]>([])

  useEffect(() => {
    const element = ref.current
    if (!element) return
    let root: HTMLElement | null = element.parentElement
    while (root && !root.querySelector('.sidebar-panel')) root = root.parentElement
    if (!root) return
    const layoutRoot = root

    let timer: ReturnType<typeof setTimeout> | undefined
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => schedule()) : null
    const measure = () => {
      const base = element.getBoundingClientRect()
      const next: ScreenRect[] = []
      layoutRoot.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR).forEach((overlay) => {
        resizeObserver?.observe(overlay)
        const rect = overlay.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) return
        next.push({ left: rect.left - base.left, top: rect.top - base.top, right: rect.right - base.left, bottom: rect.bottom - base.top })
      })
      setObstacles((previous) => (sameRects(previous, next) ? previous : next))
    }
    // Debounced: the sidebar animates its width and panels report many intermediate sizes.
    function schedule() {
      clearTimeout(timer)
      timer = setTimeout(measure, 160)
    }

    measure()
    const mutationObserver = typeof MutationObserver !== 'undefined' ? new MutationObserver(schedule) : null
    mutationObserver?.observe(layoutRoot, { childList: true })
    window.addEventListener('pointerup', schedule)
    window.addEventListener('resize', schedule)
    return () => {
      clearTimeout(timer)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      window.removeEventListener('pointerup', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ref])

  return obstacles
}
