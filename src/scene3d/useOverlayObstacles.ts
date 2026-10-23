import { useEffect, useState, type RefObject } from 'react'

/** Axis-aligned screen rectangle in CSS pixels, relative to the canvas element. */
export type ScreenRect = { left: number; top: number; right: number; bottom: number }

const OVERLAY_SELECTOR = '.sidebar-panel, .floating-panel, .interaction-hint'

function sameRects(a: ScreenRect[], b: ScreenRect[]): boolean {
  return (
    a.length === b.length &&
    a.every((rect, index) => {
      const other = b[index]
      return (
        Math.abs(rect.left - other.left) < 4 &&
        Math.abs(rect.top - other.top) < 4 &&
        Math.abs(rect.right - other.right) < 4 &&
        Math.abs(rect.bottom - other.bottom) < 4
      )
    })
  )
}

/**
 * Snapshots where the sidebar, floating panels and gesture hint sit over the canvas, so a
 * scene can frame its content in the uncovered area. Measured only when the scene opens, when
 * `refitKey` changes (e.g. a view preset) and when the window resizes: opening, collapsing or
 * dragging a panel afterwards just covers the 3D view instead of moving the camera and
 * discarding the teacher's zoom.
 */
export type OverlaySnapshot = { width: number; obstacles: ScreenRect[] }

const EMPTY_SNAPSHOT: OverlaySnapshot = { width: 0, obstacles: [] }

export function useOverlayObstacles(ref: RefObject<HTMLElement | null>, refitKey = ''): OverlaySnapshot {
  const [snapshot, setSnapshot] = useState<OverlaySnapshot>(EMPTY_SNAPSHOT)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    let root: HTMLElement | null = element.parentElement
    while (root && !root.querySelector('.sidebar-panel')) root = root.parentElement
    if (!root) return
    const layoutRoot = root

    let timer: ReturnType<typeof setTimeout> | undefined
    const measure = () => {
      const base = element.getBoundingClientRect()
      const next: ScreenRect[] = []
      layoutRoot.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR).forEach((overlay) => {
        const rect = overlay.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) return
        next.push({
          left: rect.left - base.left,
          top: rect.top - base.top,
          right: rect.right - base.left,
          bottom: rect.bottom - base.top,
        })
      })
      setSnapshot((previous) =>
        Math.abs(previous.width - base.width) < 1 && sameRects(previous.obstacles, next)
          ? previous
          : { width: base.width, obstacles: next },
      )
    }
    // Panels finish their first layout a moment after mount, so measure again once it settles.
    function schedule() {
      clearTimeout(timer)
      timer = setTimeout(measure, 200)
    }

    measure()
    schedule()
    window.addEventListener('resize', schedule)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', schedule)
    }
  }, [ref, refitKey])

  return snapshot
}
