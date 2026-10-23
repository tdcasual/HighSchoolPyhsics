import { useCallback, useEffect, useMemo, useRef, useState, type DependencyList, type RefObject } from 'react'
import { resolvePerformanceProfile } from '../../scene3d/canvasQuality'

/**
 * The container's CSS width (capped), for charts that draw on a canvas. Without ResizeObserver
 * (tests, old browsers) it reports `fallback`.
 */
export function useContainerWidth<T extends HTMLElement>(
  maxWidth = 800,
  fallback = maxWidth,
): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(() => (typeof ResizeObserver === 'undefined' ? fallback : 0))
  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(Math.min(entries[0]?.contentRect.width ?? 0, maxWidth))
      if (next > 0) setWidth((current) => (current === next ? current : next))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [maxWidth])
  return [ref, width || fallback]
}

const SLOW_MS = 25
const FAST_MS = 10
const MIN_SCALE = 0.35

/**
 * Resolution that follows how long the pattern takes to draw: after three slow draws (>25 ms)
 * the canvas renders at a lower scale, after three fast ones (<10 ms) it climbs back to the
 * device profile's maximum. A scale change redraws once on the next frame (via `revision`).
 */
export function useAdaptiveResolution() {
  const perf = useMemo(() => resolvePerformanceProfile(), [])
  const maxScale = perf.doubleSlitChartScale ?? 1
  const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, perf.canvas.dpr[1])
  const scaleRef = useRef(maxScale)
  const timesRef = useRef<number[]>([])
  const frameRef = useRef<number | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    },
    [],
  )

  /** Runs `draw`, timing it; returns what it returned. */
  const measure = useCallback(
    <T>(draw: () => T): T => {
      const startedAt = performance.now()
      const result = draw()
      const times = timesRef.current
      times.push(performance.now() - startedAt)
      if (times.length > 3) times.shift()
      if (times.length === 3) {
        const average = times.reduce((sum, value) => sum + value, 0) / times.length
        const current = scaleRef.current
        const next =
          average > SLOW_MS
            ? Math.max(MIN_SCALE, +(current - 0.1).toFixed(2))
            : average < FAST_MS
              ? Math.min(maxScale, +(current + 0.05).toFixed(2))
              : current
        if (next !== current) {
          scaleRef.current = next
          times.length = 0
          if (frameRef.current === null && typeof requestAnimationFrame === 'function') {
            frameRef.current = requestAnimationFrame(() => {
              frameRef.current = null
              setRevision((value) => value + 1)
            })
          }
        }
      }
      return result
    },
    [maxScale],
  )

  /** The current render scale (read it in effects; it changes without a render). */
  const currentScale = useCallback(() => scaleRef.current, [])
  return { perf, dpr, currentScale, measure, revision }
}

/**
 * Coarse first, fine after a pause: while `active` and the inputs keep changing (a slider being
 * dragged), `isFull()` is false; 200 ms after the last change it turns true and the returned
 * revision bumps so the chart redraws at full quality.
 */
export function useSettledQuality(active: boolean, deps: DependencyList, delayMs = 200) {
  const fullRef = useRef(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!active) {
      fullRef.current = true
      return
    }
    fullRef.current = false
    const timer = window.setTimeout(() => {
      fullRef.current = true
      setRevision((value) => value + 1)
    }, delayMs)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller's inputs decide when to settle
  }, [active, delayMs, ...deps])
  const isFull = useCallback(() => fullRef.current, [])
  return { isFull, revision }
}

/** Sizes a canvas's backing store; returns false when nothing changed. */
export function sizeCanvas(canvas: HTMLCanvasElement, pixelWidth: number, pixelHeight: number): boolean {
  const width = Math.max(1, Math.round(pixelWidth))
  const height = Math.max(1, Math.round(pixelHeight))
  if (canvas.width === width && canvas.height === height) return false
  canvas.width = width
  canvas.height = height
  return true
}
