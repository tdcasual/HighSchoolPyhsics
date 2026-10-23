import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Measures the three floating panels stacked in one column (data → chart → playback) so each
 * starts below the one before it. Returns a ref callback per panel and the measured heights.
 */
export function usePanelStack() {
  const [heights, setHeights] = useState<number[]>([])
  const elementsRef = useRef(new Map<number, HTMLDivElement>())
  const observersRef = useRef(new Map<number, ResizeObserver>())

  const register = useCallback((index: number, el: HTMLDivElement | null) => {
    if (elementsRef.current.get(index) === el) return
    observersRef.current.get(index)?.disconnect()
    observersRef.current.delete(index)
    if (!el) {
      elementsRef.current.delete(index)
      return
    }
    elementsRef.current.set(index, el)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      // Stack by the rendered outer box; contentRect omits the header's border and padding.
      // Whole pixels keep the next panel's edges crisp over the blurred canvas.
      const h = Math.ceil(el.getBoundingClientRect().height)
      if (h > 0) {
        setHeights((previous) => {
          const next = [...previous]
          next[index] = h
          return next
        })
      }
    })
    observer.observe(el)
    observersRef.current.set(index, observer)
  }, [])

  // Stable ref callbacks, so React does not detach and re-attach the panels every render.
  const attachData = useCallback((el: HTMLDivElement | null) => register(0, el), [register])
  const attachChart = useCallback((el: HTMLDivElement | null) => register(1, el), [register])
  const attachPlayback = useCallback((el: HTMLDivElement | null) => register(2, el), [register])

  useEffect(() => {
    const observers = observersRef.current
    return () => {
      for (const observer of observers.values()) observer.disconnect()
      observers.clear()
    }
  }, [])

  return { attachData, attachChart, attachPlayback, heights }
}
