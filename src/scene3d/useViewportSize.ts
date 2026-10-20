import { useEffect, useState, type RefObject } from 'react'

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
