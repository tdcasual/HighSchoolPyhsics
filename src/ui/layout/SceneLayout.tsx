import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAppStore } from '../../store/useAppStore'
import { resolveLayoutTier, type LayoutTier } from './layoutPolicy'
import type { PresentationSignal } from './presentationSignals'
import { usePresentationStrategy } from './usePresentationStrategy'
import { useResizableSplitPanel } from './useResizableSplitPanel'
import { usePresentationDirector, type PresentationIntent } from './usePresentationDirector'
import { findRuntimeSceneCatalogEntry, resolveClassroomSmartPresentation } from '../../app/sceneCatalog'

type SceneLayoutProps = {
  controls: ReactNode
  viewport: ReactNode
  presentationSignals: PresentationSignal[]
  coreSummary: ReactNode
  presentationIntent?: PresentationIntent
}

function readViewportWidth(): number {
  if (typeof window === 'undefined') {
    return 1280
  }
  return window.innerWidth
}

export function SceneLayout({
  controls,
  viewport,
  presentationSignals,
  coreSummary,
  presentationIntent,
}: SceneLayoutProps) {
  const presentationMode = useAppStore((state) => state.presentationMode)
  const activeScenePath = useAppStore((state) => state.activeScenePath)
  const presentationRouteModes = useAppStore((state) => state.presentationRouteModes)
  const controlsRef = useRef<HTMLElement | null>(null)
  const viewportRef = useRef<HTMLElement | null>(null)
  const [tier, setTier] = useState<LayoutTier>(() => resolveLayoutTier(readViewportWidth()))
  const smartPresentation = useMemo(
    () => resolveClassroomSmartPresentation(findRuntimeSceneCatalogEntry(activeScenePath)?.classroom),
    [activeScenePath],
  )

  const { routeMode, presentationStrategy, autoSignalScore } = usePresentationStrategy({
    presentationSignals,
    controls,
    controlsRef,
    viewportRef,
    activeScenePath,
    presentationRouteModes,
  })

  const { layoutDecision, summaryMode } = usePresentationDirector({
    presentationMode,
    routeMode,
    autoSignalScore,
    presentationSignals,
    controlsRef,
    presentationIntent,
    smartPresentation,
  })

  const compact = tier !== 'desktop' || (presentationMode && presentationStrategy === 'viewport')

  const {
    minLeftWidthPx,
    maxLeftWidthPx,
    resolvedLeftPanelWidthPx,
    layoutStyle,
    onDividerPointerDown,
    onDividerPointerMove,
    onDividerPointerUp,
    onDividerPointerCancel,
    onDividerKeyDown,
  } = useResizableSplitPanel({
    compact,
    tier,
    presentationMode,
    presentationStrategy,
  })

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

  const viewportPanel = <section ref={viewportRef} className="viewport-panel">{viewport}</section>
  const desktopSummaryVisible = presentationMode && !compact && summaryMode !== 'hidden'
  const compactSummaryVisible = presentationMode && compact && coreSummary
  const summaryClassName = `scene-core-summary ${summaryMode === 'sticky' ? 'scene-core-summary--sticky' : ''} ${summaryMode === 'emphasis' ? 'scene-core-summary--emphasis' : ''}`.trim()

  const scaffoldClassName = useMemo(
    () =>
      `scene-layout scene-layout--${tier} ${presentationMode ? `scene-layout--presentation scene-layout--presentation-${presentationStrategy} scene-layout--presentation-${layoutDecision}` : ''}`.trim(),
    [layoutDecision, presentationMode, presentationStrategy, tier],
  )

  return (
    <div className={scaffoldClassName} style={layoutStyle} data-presentation-layout-decision={layoutDecision}>
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
      {compactSummaryVisible ? (
        <section className={summaryClassName} aria-label="课堂核心信息">
          {coreSummary}
        </section>
      ) : null}
      {desktopSummaryVisible ? (
        <section className={summaryClassName} aria-label="课堂核心信息">
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
