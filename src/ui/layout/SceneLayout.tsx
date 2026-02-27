import {
  useEffect,
  useMemo,
  useRef,
  useState,
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
  const [controlsExpanded, setControlsExpanded] = useState<boolean>(() => {
    const initialTier = resolveLayoutTier(readViewportWidth())
    return initialTier !== 'mobile' && (!presentationMode || presentationStrategy === 'split')
  })

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
  const scaffoldClassName = useMemo(
    () =>
      `scene-layout scene-layout--${tier} ${presentationMode ? `scene-layout--presentation scene-layout--presentation-${presentationStrategy}` : ''}`.trim(),
    [presentationMode, presentationStrategy, tier],
  )

  return (
    <div className={scaffoldClassName}>
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
          {viewportPanel}
        </>
      )}
    </div>
  )
}
