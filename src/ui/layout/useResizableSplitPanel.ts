import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import {
  clamp,
  isPresentationSplit,
  resolveLeftPanelBounds,
  resolvePreferredLeftWidthPx,
  SPLIT_DIVIDER_WIDTH_PX,
  type LayoutTier,
  type PresentationStrategy,
} from './layoutPolicy'

function readViewportWidth(): number {
  if (typeof window === 'undefined') {
    return 1280
  }
  return window.innerWidth
}

type ResizeDragState = {
  pointerId: number
  startX: number
  startWidth: number
}

export function resolveResizedWidth(
  startWidth: number,
  startX: number,
  clientX: number,
  minWidth: number,
  maxWidth: number,
): number {
  const delta = clientX - startX
  return clamp(startWidth + delta, minWidth, maxWidth)
}

type UseResizableSplitPanelOptions = {
  compact: boolean
  tier: LayoutTier
  presentationMode: boolean
  presentationStrategy: PresentationStrategy
}

type UseResizableSplitPanelResult = {
  minLeftWidthPx: number
  maxLeftWidthPx: number
  resolvedLeftPanelWidthPx: number
  layoutStyle:
    | {
        gridTemplateColumns: string
      }
    | undefined
  onDividerPointerDown: (event: PointerEvent<HTMLButtonElement>) => void
  onDividerPointerMove: (event: PointerEvent<HTMLButtonElement>) => void
  onDividerPointerUp: (event: PointerEvent<HTMLButtonElement>) => void
  onDividerPointerCancel: (event: PointerEvent<HTMLButtonElement>) => void
  onDividerKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

export function useResizableSplitPanel({
  compact,
  tier,
  presentationMode,
  presentationStrategy,
}: UseResizableSplitPanelOptions): UseResizableSplitPanelResult {
  const resizeStateRef = useRef<ResizeDragState | null>(null)
  const splitDefaultsAppliedRef = useRef<boolean>(false)

  const [leftPanelWidthPx, setLeftPanelWidthPx] = useState<number>(() => {
    const viewportWidth = readViewportWidth()
    return resolveLeftPanelBounds(viewportWidth, presentationMode, presentationStrategy).preferred
  })

  const bounds = resolveLeftPanelBounds(readViewportWidth(), presentationMode, presentationStrategy)
  const minLeftWidthPx = bounds.min
  const maxLeftWidthPx = bounds.max
  const resolvedLeftPanelWidthPx = clamp(leftPanelWidthPx, minLeftWidthPx, maxLeftWidthPx)

  useEffect(() => {
    const splitDesktop = tier === 'desktop' && isPresentationSplit(presentationMode, presentationStrategy)
    if (!splitDesktop) {
      splitDefaultsAppliedRef.current = false
      return
    }
    if (splitDefaultsAppliedRef.current) {
      return
    }

    splitDefaultsAppliedRef.current = true
    const rafId = window.requestAnimationFrame(() => {
      const viewportWidth = readViewportWidth()
      const preferred = resolvePreferredLeftWidthPx(viewportWidth, presentationMode, presentationStrategy)
      setLeftPanelWidthPx(clamp(preferred, minLeftWidthPx, maxLeftWidthPx))
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [maxLeftWidthPx, minLeftWidthPx, presentationMode, presentationStrategy, tier])

  useEffect(() => {
    if (!compact) {
      return
    }
    resizeStateRef.current = null
  }, [compact])

  const stopResize = (event: PointerEvent<HTMLButtonElement>) => {
    const state = resizeStateRef.current
    if (!state || state.pointerId !== event.pointerId) {
      return
    }
    resizeStateRef.current = null
    if (
      typeof event.currentTarget.hasPointerCapture === 'function' &&
      typeof event.currentTarget.releasePointerCapture === 'function' &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const onDividerPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (compact) {
      return
    }

    event.preventDefault()
    resizeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: resolvedLeftPanelWidthPx,
    }
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  const onDividerPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const state = resizeStateRef.current
    if (!state || state.pointerId !== event.pointerId || compact) {
      return
    }

    event.preventDefault()
    setLeftPanelWidthPx(
      resolveResizedWidth(state.startWidth, state.startX, event.clientX, minLeftWidthPx, maxLeftWidthPx),
    )
  }

  const onDividerPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    stopResize(event)
  }

  const onDividerPointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    stopResize(event)
  }

  const onDividerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (compact) {
      return
    }

    const step = event.shiftKey ? 64 : 24
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setLeftPanelWidthPx((value) => clamp(value - step, minLeftWidthPx, maxLeftWidthPx))
      return
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setLeftPanelWidthPx((value) => clamp(value + step, minLeftWidthPx, maxLeftWidthPx))
    }
  }

  const layoutStyle = !compact
    ? {
        gridTemplateColumns: `${resolvedLeftPanelWidthPx}px ${SPLIT_DIVIDER_WIDTH_PX}px minmax(0, 1fr)`,
      }
    : undefined

  return {
    minLeftWidthPx,
    maxLeftWidthPx,
    resolvedLeftPanelWidthPx,
    layoutStyle,
    onDividerPointerDown,
    onDividerPointerMove,
    onDividerPointerUp,
    onDividerPointerCancel,
    onDividerKeyDown,
  }
}
