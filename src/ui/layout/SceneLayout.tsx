import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { useAppStore, type PresentationLayoutMode } from '../../store/useAppStore'

type LayoutTier = 'desktop' | 'tablet' | 'mobile'
type PresentationSignal = 'chart' | 'live-metric' | 'time-series' | 'interactive-readout'
type PresentationStrategy = Exclude<PresentationLayoutMode, 'auto'>

type SceneLayoutProps = {
  controls: ReactNode
  viewport: ReactNode
  presentationSignals?: PresentationSignal[]
  coreSummary?: ReactNode
}

type ResizeDragState = {
  pointerId: number
  startX: number
  startWidth: number
}

function resolveLayoutTier(width: number): LayoutTier {
  if (width < 768) {
    return 'mobile'
  }
  if (width < 1200) {
    return 'tablet'
  }
  return 'desktop'
}

function readViewportWidth(): number {
  if (typeof window === 'undefined') {
    return 1280
  }
  return window.innerWidth
}

function readCurrentPathname(): string {
  if (typeof window === 'undefined') {
    return '/'
  }

  const normalized = window.location.pathname.replace(/\/+$/, '')
  return normalized || '/'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

const PRESENTATION_SIGNAL_WEIGHTS: Record<PresentationSignal, number> = {
  chart: 2,
  'live-metric': 1,
  'time-series': 1,
  'interactive-readout': 1,
}

const KNOWN_PRESENTATION_SIGNALS = new Set<PresentationSignal>([
  'chart',
  'live-metric',
  'time-series',
  'interactive-readout',
])

function parsePresentationSignals(raw: string | null): PresentationSignal[] {
  if (!raw) {
    return []
  }

  return raw
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token): token is PresentationSignal => KNOWN_PRESENTATION_SIGNALS.has(token as PresentationSignal))
}

function scorePresentationSignals(signals: Iterable<PresentationSignal>): number {
  let score = 0
  for (const signal of signals) {
    score += PRESENTATION_SIGNAL_WEIGHTS[signal]
  }
  return score
}

export function SceneLayout({
  controls,
  viewport,
  presentationSignals = [],
  coreSummary,
}: SceneLayoutProps) {
  const presentationMode = useAppStore((state) => state.presentationMode)
  const activeScenePath = useAppStore((state) => state.activeScenePath)
  const presentationRouteModes = useAppStore((state) => state.presentationRouteModes)
  const controlsRef = useRef<HTMLElement | null>(null)
  const [tier, setTier] = useState<LayoutTier>(() => resolveLayoutTier(readViewportWidth()))
  const [autoSignalScore, setAutoSignalScore] = useState<number>(() =>
    scorePresentationSignals(new Set(presentationSignals)),
  )
  const routePathKey = typeof window === 'undefined' ? activeScenePath || '/' : readCurrentPathname()
  const routeMode = presentationRouteModes[routePathKey] ?? 'auto'
  const presentationStrategy: PresentationStrategy =
    routeMode === 'auto' ? (autoSignalScore >= 2 ? 'split' : 'viewport') : routeMode
  const compact =
    tier !== 'desktop' || (presentationMode && presentationStrategy === 'viewport')
  const resizeStateRef = useRef<ResizeDragState | null>(null)
  const [controlsExpanded, setControlsExpanded] = useState<boolean>(() => {
    const initialTier = resolveLayoutTier(readViewportWidth())
    return initialTier !== 'mobile' && (!presentationMode || presentationStrategy === 'split')
  })
  const [leftPanelWidthPx, setLeftPanelWidthPx] = useState<number>(() => {
    const viewportWidth = readViewportWidth()
    const preferred = presentationMode && presentationStrategy === 'split'
      ? Math.round(viewportWidth * 0.42)
      : 320
    const minLeft = presentationMode && presentationStrategy === 'split' ? 320 : 240
    const maxLeft = Math.max(minLeft + 80, viewportWidth - 320)
    return clamp(preferred, minLeft, maxLeft)
  })

  const minLeftWidthPx = presentationMode && presentationStrategy === 'split' ? 320 : 240
  const maxLeftWidthPx = Math.max(minLeftWidthPx + 80, readViewportWidth() - 320)
  const resolvedLeftPanelWidthPx = clamp(leftPanelWidthPx, minLeftWidthPx, maxLeftWidthPx)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const onResize = () => {
      setTier(resolveLayoutTier(window.innerWidth))
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      const nextSignals = new Set<PresentationSignal>(presentationSignals)
      const signalNodes = controlsRef.current?.querySelectorAll('[data-presentation-signal]') ?? []
      signalNodes.forEach((node) => {
        parsePresentationSignals(node.getAttribute('data-presentation-signal')).forEach((signal) => {
          nextSignals.add(signal)
        })
      })
      setAutoSignalScore(scorePresentationSignals(nextSignals))
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [controls, presentationSignals])

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setControlsExpanded(
        tier !== 'mobile' && (!presentationMode || presentationStrategy === 'split'),
      )
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [presentationMode, presentationStrategy, tier])

  useEffect(() => {
    if (!compact) {
      return
    }
    resizeStateRef.current = null
  }, [compact])

  const toggleLabel = presentationMode
    ? controlsExpanded
      ? '隐藏控制面板'
      : '显示控制面板'
    : controlsExpanded
      ? '收起参数面板'
      : '展开参数面板'
  const controlsPanel = (
    <aside
      ref={controlsRef}
      className={`control-panel ${compact ? 'control-panel--compact' : ''} ${controlsExpanded ? 'control-panel--expanded' : 'control-panel--collapsed'}`}
      aria-hidden={compact ? !controlsExpanded : false}
      data-compact={compact ? 'true' : 'false'}
      hidden={compact && !controlsExpanded}
    >
      {controls}
    </aside>
  )

  const viewportPanel = <section className="viewport-panel">{viewport}</section>
  const layoutStyle =
    !compact
      ? {
          gridTemplateColumns: `${resolvedLeftPanelWidthPx}px 24px minmax(0, 1fr)`,
        }
      : undefined

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
    const delta = event.clientX - state.startX
    setLeftPanelWidthPx(clamp(state.startWidth + delta, minLeftWidthPx, maxLeftWidthPx))
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

  const scaffoldClassName = useMemo(
    () =>
      `scene-layout scene-layout--${tier} ${presentationMode ? `scene-layout--presentation scene-layout--presentation-${presentationStrategy}` : ''}`.trim(),
    [presentationMode, presentationStrategy, tier],
  )

  return (
    <div className={scaffoldClassName} style={layoutStyle}>
      {compact ? (
        <div className="scene-toolbar" role="toolbar" aria-label="场景参数工具条">
          <button
            className="scene-toolbar-toggle touch-target"
            type="button"
            aria-expanded={controlsExpanded}
            onClick={() => setControlsExpanded((value) => !value)}
          >
            {toggleLabel}
          </button>
        </div>
      ) : null}
      {presentationMode && compact && coreSummary ? (
        <section className="scene-core-summary" aria-label="课堂核心信息">
          {coreSummary}
        </section>
      ) : null}
      {compact ? (
        <>
          {viewportPanel}
          {controlsPanel}
        </>
      ) : (
        <>
          {controlsPanel}
          <button
            type="button"
            className="scene-layout-divider"
            role="separator"
            aria-label="调整左右面板宽度"
            aria-orientation="vertical"
            aria-valuemin={minLeftWidthPx}
            aria-valuemax={maxLeftWidthPx}
            aria-valuenow={Math.round(resolvedLeftPanelWidthPx)}
            onPointerDown={onDividerPointerDown}
            onPointerMove={onDividerPointerMove}
            onPointerUp={onDividerPointerUp}
            onPointerCancel={onDividerPointerCancel}
            onKeyDown={onDividerKeyDown}
          >
            <span aria-hidden="true" />
          </button>
          {viewportPanel}
        </>
      )}
    </div>
  )
}
