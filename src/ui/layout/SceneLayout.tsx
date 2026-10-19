import { useCallback, useLayoutEffect, useMemo, useRef, useState, useEffect, type ReactNode } from 'react'
import { FloatingPanel } from '../panels/FloatingPanel'
import { SceneActions } from '../controls/SceneActions'
import { SidebarPanel } from '../panels/SidebarPanel'
import { SegmentedControl } from '../controls/SegmentedControl'
import { useMediaQuery, MOBILE_BREAKPOINT } from '../hooks/useMediaQuery'
import { useAppStore, type MobilePlaybackAction } from '../../store/useAppStore'
import { ModelNoteTargetContext } from '../notes/modelNoteTarget'
import { PredictionContext, type PredictionState } from '../notes/predictionContext'

type SceneLayoutProps = {
  viewport: ReactNode
  controls: ReactNode
  dataOverlay?: ReactNode
  /**
   * Model caveats, formulas and teaching explanations. Shown collapsed at the end of the
   * sidebar so the data panel can stay at 3–5 readings and the sidebar at its controls.
   */
  notes?: ReactNode
  chart?: ReactNode
  playbackActions?: MobilePlaybackAction[]
  playbackControls?: ReactNode
  chartVisible?: boolean
  chartContentClassName?: string
  chartInitiallyCollapsed?: boolean
  dataInitiallyCollapsed?: boolean
  overlayZIndex?: 'z-10' | 'z-20'
}

type MobileTabKey = 'controls' | 'data' | 'chart'

/** Playback action keys that Space toggles (play/pause), so the teacher never hunts for the button. */
const PRIMARY_PLAYBACK_KEYS = new Set(['play', 'toggle-running'])

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true
  return target instanceof HTMLInputElement && !['range', 'checkbox', 'radio', 'button', 'submit'].includes(target.type)
}

const SIDEBAR_WIDTH = 320
const SIDEBAR_COLLAPSED_WIDTH = 44
const PANEL_GAP = 20
const STACK_GAP = 12

export function SceneLayout({
  viewport,
  controls,
  dataOverlay,
  notes,
  chart,
  playbackActions,
  playbackControls,
  chartVisible = false,
  chartContentClassName,
  chartInitiallyCollapsed = false,
  dataInitiallyCollapsed = false,
  overlayZIndex = 'z-10',
}: SceneLayoutProps) {
  const [chartDismissVersion, setChartDismissVersion] = useState(0)
  const [playbackDismissVersion, setPlaybackDismissVersion] = useState(0)
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTabKey>('controls')
  const [notesTarget, setNotesTarget] = useState<HTMLDivElement | null>(null)
  const predicting = useAppStore((s) => s.predicting)
  const setPredicting = useAppStore((s) => s.setPredicting)
  const [answerCount, setAnswerCount] = useState(0)
  const [predictionRound, setPredictionRound] = useState({ predicting, round: 0, revealAll: false })
  // A new round starts whenever prediction mode turns on (adjusting state during render).
  if (predictionRound.predicting !== predicting) {
    setPredictionRound((current) => ({ predicting, round: predicting ? current.round + 1 : current.round, revealAll: false }))
  }
  const registerAnswer = useCallback(() => {
    setAnswerCount((count) => count + 1)
    return () => setAnswerCount((count) => count - 1)
  }, [])
  const prediction = useMemo<PredictionState>(
    () => ({ predicting, round: predictionRound.round, revealAll: predictionRound.revealAll, register: registerAnswer }),
    [predicting, predictionRound.round, predictionRound.revealAll, registerAnswer],
  )
  // Charts usually plot the outcome too (e.g. P's future displacement), so in prediction mode the
  // chart stays covered until the teacher opens it or reveals everything.
  const [chartRevealedRound, setChartRevealedRound] = useState<number | null>(null)
  const chartMasked = predicting && answerCount > 0 && !predictionRound.revealAll && chartRevealedRound !== predictionRound.round
  const chartBody = chartMasked ? (
    <button type="button" className="chart-mask" onClick={() => setChartRevealedRound(predictionRound.round)}>
      图表含结论 · 点击显示
    </button>
  ) : chart
  const predictionActions = answerCount > 0 ? (
    <>
      {predicting && !predictionRound.revealAll ? (
        <button
          type="button"
          className="panel-text-button"
          onClick={() => setPredictionRound((current) => ({ ...current, revealAll: true }))}
        >
          全部揭晓
        </button>
      ) : null}
      <button
        type="button"
        className={`panel-text-button${predicting ? ' active' : ''}`}
        aria-pressed={predicting}
        aria-keyshortcuts="H"
        title="预测模式：先遮住结论，学生预测后再揭晓（快捷键 H）"
        onClick={() => setPredicting(!predicting)}
      >
        预测
      </button>
    </>
  ) : null
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  const setMobilePlaybackActions = useAppStore((s) => s.setMobilePlaybackActions)
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed)

  // Stable key for playback actions to avoid effect re-running on every render
  const playbackActionsKey = useMemo(() => {
    return playbackActions?.map((a) => `${a.key}:${a.label}:${a.disabled ?? false}`).join('|') ?? ''
  }, [playbackActions])

  const prevChartVisibleRef = useRef(chartVisible)

  // Reset dismiss version when chartVisible transitions false→true.
  useLayoutEffect(() => {
    if (chartVisible && !prevChartVisibleRef.current) {
      setChartDismissVersion(0)
    }
    prevChartVisibleRef.current = chartVisible
  }, [chartVisible])

  useEffect(() => {
    if (isMobile) {
      setMobilePlaybackActions(playbackActions ?? [])
      return () => setMobilePlaybackActions([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- playbackActionsKey is a stable serialization of playbackActions
  }, [isMobile, playbackActionsKey])

  const primaryPlayback = playbackActions?.find((action) => PRIMARY_PLAYBACK_KEYS.has(action.key))
  const primaryPlaybackRef = useRef(primaryPlayback)
  useLayoutEffect(() => {
    primaryPlaybackRef.current = primaryPlayback
  })

  // Space = play/pause. A button the teacher just clicked keeps focus and would otherwise
  // re-trigger on Space (e.g. 重置), so pointer-focused controls hand Space to playback too;
  // controls reached with Tab keep their native Space activation.
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
      if (event.key !== ' ' || event.repeat || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (isTextEntry(target)) return
      if (target instanceof HTMLElement && target !== document.body && target !== pointerFocused) return
      const action = primaryPlaybackRef.current
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

  const showChart = chartVisible && chartDismissVersion === 0
  const chartDismissed = Boolean(chart) && chartVisible && chartDismissVersion !== 0
  const hasPlayback = Boolean(playbackActions || playbackControls)
  const playbackDismissed = hasPlayback && playbackDismissVersion !== 0
  // Every scene stacks its overlays in one column right after the sidebar (data → chart →
  // playback), leaving the rest of the canvas as one uncovered area for the 3D composition.
  const panelX = (sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH) + PANEL_GAP
  const [panelHeights, setPanelHeights] = useState<number[]>([])
  const panelElsRef = useRef<Map<number, HTMLDivElement>>(new Map())
  const panelObserversRef = useRef<Map<number, ResizeObserver>>(new Map())

  const chartPanelY = dataOverlay ? (panelHeights[0] ?? 0) + STACK_GAP : 0
  const playbackPanelY = chartPanelY + (chart && showChart ? (panelHeights[1] ?? 0) + STACK_GAP : 0)

  const registerPanel = useCallback((index: number, el: HTMLDivElement | null) => {
    const prev = panelElsRef.current.get(index)
    if (prev === el) return

    // Clean up previous observer
    const prevObserver = panelObserversRef.current.get(index)
    if (prevObserver) {
      prevObserver.disconnect()
      panelObserversRef.current.delete(index)
    }

    if (el) {
      panelElsRef.current.set(index, el)
      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => {
          // Stack by the rendered outer box; contentRect omits the header's border and padding.
          const h = el.getBoundingClientRect().height
          if (h > 0) {
            setPanelHeights((prev) => {
              const next = [...prev]
              next[index] = h
              return next
            })
          }
        })
        observer.observe(el)
        panelObserversRef.current.set(index, observer)
      }
    } else {
      panelElsRef.current.delete(index)
    }
  }, [])

  // Stable ref callbacks — avoid creating new function references on every render
  const stableRef0 = useCallback((el: HTMLDivElement | null) => registerPanel(0, el), [registerPanel])
  const stableRef1 = useCallback((el: HTMLDivElement | null) => registerPanel(1, el), [registerPanel])
  const stableRef2 = useCallback((el: HTMLDivElement | null) => registerPanel(2, el), [registerPanel])

  useEffect(() => {
    const observers = panelObserversRef.current
    return () => {
      for (const obs of observers.values()) obs.disconnect()
      observers.clear()
    }
  }, [])

  const mobileTabOptions = useMemo(() => {
    const tabs: Array<{ key: MobileTabKey; label: string }> = []
    tabs.push({ key: 'controls', label: '参数' })
    if (dataOverlay) tabs.push({ key: 'data', label: '数据' })
    if (chart && showChart) tabs.push({ key: 'chart', label: '图表' })
    return tabs
  }, [dataOverlay, chart, showChart])

  const effectiveMobileTab = useMemo(() => {
    if (mobileTabOptions.some((t) => t.key === activeMobileTab)) {
      return activeMobileTab
    }
    return mobileTabOptions[0]?.key ?? 'controls'
  }, [mobileTabOptions, activeMobileTab])

  // Always mounted so <ModelNote>s inside the controls can portal into it; hidden by CSS when empty.
  const notesBlock = (
    <details className="scene-notes">
      <summary className="touch-target">教师备注 · 模型与公式</summary>
      <div className="scene-notes-body">
        {notes}
        <div className="scene-notes-portal" ref={setNotesTarget} />
      </div>
    </details>
  )

  if (isMobile) {
    return (
      <ModelNoteTargetContext.Provider value={notesTarget}>
      <PredictionContext.Provider value={prediction}>
      <div className="flex flex-col w-full h-full">
        <div className="flex-1 min-h-0">{viewport}</div>

        <div
          className="mobile-bottom-panel shrink-0 flex flex-col border-t"
          style={{ height: effectiveMobileTab === 'controls' ? '30vh' : '46vh' }}
        >
          {dataOverlay && effectiveMobileTab === 'controls' && <div className="mobile-data-strip">{dataOverlay}</div>}
          <div className="px-2 pt-1.5 shrink-0">
            <SegmentedControl
              options={mobileTabOptions}
              value={effectiveMobileTab}
              onChange={(key) => setActiveMobileTab(key as MobileTabKey)}
            />
          </div>
          {playbackControls && <div className="px-2 pt-2 shrink-0">{playbackControls}</div>}
          <div className="sidebar-body flex-1 overflow-y-auto px-3 pt-2 pb-3">
            {effectiveMobileTab === 'controls' && controls}
            {effectiveMobileTab === 'controls' && notesBlock}
            {effectiveMobileTab === 'data' && dataOverlay}
            {effectiveMobileTab === 'chart' && chartBody}
          </div>
        </div>
      </div>
      </PredictionContext.Provider>
      </ModelNoteTargetContext.Provider>
    )
  }

  return (
    <ModelNoteTargetContext.Provider value={notesTarget}>
    <PredictionContext.Provider value={prediction}>
    <div className="relative w-full h-full">
      <div className="absolute inset-0 z-0">{viewport}</div>

      <SidebarPanel title="参数控制" collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed}>
        {controls}
        {notesBlock}
      </SidebarPanel>

      {dataOverlay && (
        <FloatingPanel
          key={dataInitiallyCollapsed ? 'data-collapsed' : 'data-expanded'}
          title="数据"
          zone="data"
          headerActions={predictionActions}
          ref={stableRef0}
          defaultCollapsed={dataInitiallyCollapsed}
          defaultPosition={{ x: 0, y: 0 }}
          offsetX={panelX}
          zIndex={overlayZIndex}
        >
          <div className="min-w-[200px]">{dataOverlay}</div>
        </FloatingPanel>
      )}

      {chart && showChart && (
        <FloatingPanel
          key={chartInitiallyCollapsed ? 'chart-collapsed' : 'chart-expanded'}
          title="图表"
          zone="chart"
          ref={stableRef1}
          defaultCollapsed={chartInitiallyCollapsed}
          defaultPosition={{ x: 0, y: chartPanelY }}
          offsetX={panelX}
          zIndex={overlayZIndex}
          closable
          onClose={() => setChartDismissVersion(1)}
          resizable
        >
          <div className={chartContentClassName ? `scene-chart-content ${chartContentClassName}` : 'scene-chart-content'}>{chartBody}</div>
        </FloatingPanel>
      )}

      {hasPlayback && !playbackDismissed && (
        <FloatingPanel
          title="播放控制"
          zone="playback"
          ref={stableRef2}
          defaultPosition={{ x: 0, y: playbackPanelY }}
          offsetX={panelX}
          zIndex="z-20"
          closable
          onClose={() => setPlaybackDismissVersion(1)}
        >
          <div className="flex flex-col gap-3">
            {playbackControls}
            {playbackActions && (
              <div className="flex items-center gap-2">
                <SceneActions actions={playbackActions} />
              </div>
            )}
          </div>
        </FloatingPanel>
      )}

      {(chartDismissed || playbackDismissed) && (
        <div className="panel-restore-dock scene-actions absolute z-20" style={{ left: panelX }} role="toolbar" aria-label="已关闭的面板">
          {chartDismissed && (
            <button type="button" className="touch-target" onClick={() => setChartDismissVersion(0)}>
              显示图表
            </button>
          )}
          {playbackDismissed && (
            <button type="button" className="touch-target" onClick={() => setPlaybackDismissVersion(0)}>
              显示播放控制
            </button>
          )}
        </div>
      )}
    </div>
    </PredictionContext.Provider>
    </ModelNoteTargetContext.Provider>
  )
}
