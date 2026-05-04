import { useCallback, useLayoutEffect, useMemo, useRef, useState, useEffect, type ReactNode } from 'react'
import { FloatingPanel } from '../panels/FloatingPanel'
import { SceneActions } from '../controls/SceneActions'
import { SidebarPanel } from '../panels/SidebarPanel'
import { SegmentedControl } from '../controls/SegmentedControl'
import { useMediaQuery, MOBILE_BREAKPOINT } from '../hooks/useMediaQuery'
import { useAppStore, type MobilePlaybackAction } from '../../store/useAppStore'

type SceneLayoutProps = {
  viewport: ReactNode
  controls: ReactNode
  dataOverlay?: ReactNode
  chart?: ReactNode
  playbackActions?: MobilePlaybackAction[]
  chartVisible?: boolean
}

type MobileTabKey = 'controls' | 'data' | 'chart'

const SIDEBAR_WIDTH = 320
const SIDEBAR_COLLAPSED_WIDTH = 44
const PANEL_GAP = 20
const STACK_GAP = 12

export function SceneLayout({
  viewport,
  controls,
  dataOverlay,
  chart,
  playbackActions,
  chartVisible = false,
}: SceneLayoutProps) {
  const [chartDismissVersion, setChartDismissVersion] = useState(0)
  const [playbackDismissVersion, setPlaybackDismissVersion] = useState(0)
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTabKey>('controls')
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  const setMobilePlaybackActions = useAppStore((s) => s.setMobilePlaybackActions)
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed)

  const prevChartVisibleRef = useRef(chartVisible)

  // Reset dismiss version when chartVisible transitions false→true.
  /* eslint-disable react-hooks/set-state-in-effect -- intentional sync on specific transition */
  useLayoutEffect(() => {
    if (chartVisible && !prevChartVisibleRef.current) {
      setChartDismissVersion(0)
    }
    prevChartVisibleRef.current = chartVisible
  }, [chartVisible])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (isMobile) {
      setMobilePlaybackActions(playbackActions ?? [])
      return () => setMobilePlaybackActions([])
    }
  }, [isMobile, playbackActions?.length, playbackActions?.[0]?.key, playbackActions?.[0]?.label, playbackActions?.[0]?.disabled, playbackActions?.[1]?.key, playbackActions?.[1]?.label, playbackActions?.[1]?.disabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const showChart = chartVisible && chartDismissVersion === 0
  const showPlayback = playbackActions && playbackDismissVersion === 0
  const panelX = useMemo(
    () => (sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH) + PANEL_GAP,
    [sidebarCollapsed],
  )

  // Panel stacking: measure each panel's height and offset subsequent panels
  const [panelHeights, setPanelHeights] = useState<number[]>([])
  const panelElsRef = useRef<Map<number, HTMLDivElement>>(new Map())
  const panelObserversRef = useRef<Map<number, ResizeObserver>>(new Map())

  // Compute stacked Y positions from measured panel heights
  const stackedYs = useMemo(() => {
    const result: number[] = []
    let cumulative = 0
    for (let i = 0; i < panelHeights.length; i++) {
      result[i] = cumulative
      cumulative += (panelHeights[i] ?? 0) + STACK_GAP
    }
    return result
  }, [panelHeights])

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
        const observer = new ResizeObserver(([entry]) => {
          const h = entry.contentRect.height
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

  if (isMobile) {
    return (
      <div className="flex flex-col w-full h-full">
        <div className="flex-1 min-h-0">
          {viewport}
        </div>

        <div className="shrink-0 flex flex-col border-t border-gray-200 dark:border-[#2f4863]" style={{ height: '30vh' }}>
          <div className="px-2 pt-1.5 shrink-0">
            <SegmentedControl
              options={mobileTabOptions}
              value={effectiveMobileTab}
              onChange={(key) => setActiveMobileTab(key as MobileTabKey)}
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {effectiveMobileTab === 'controls' && controls}
            {effectiveMobileTab === 'data' && dataOverlay}
            {effectiveMobileTab === 'chart' && chart}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 z-0">
        {viewport}
      </div>

      <SidebarPanel
        title="参数控制"
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      >
        {controls}
      </SidebarPanel>

      {dataOverlay && (
        <FloatingPanel
          title="数据"
          ref={stableRef0}
          defaultPosition={{ x: panelX, y: stackedYs[0] ?? 0 }}
          offsetX={panelX}
        >
          <div className="min-w-[200px]">
            {dataOverlay}
          </div>
        </FloatingPanel>
      )}

      {chart && showChart && (
        <FloatingPanel
          title="图表"
          ref={stableRef1}
          defaultPosition={{ x: panelX, y: stackedYs[1] ?? 300 }}
          offsetX={panelX}
          closable
          onClose={() => setChartDismissVersion(1)}
        >
          <div className="min-w-[300px]">
            {chart}
          </div>
        </FloatingPanel>
      )}

      {showPlayback && (
        <FloatingPanel
          title="播放控制"
          ref={stableRef2}
          defaultPosition={{ x: panelX, y: stackedYs[2] ?? 500 }}
          offsetX={panelX}
          zIndex="z-20"
          closable
          onClose={() => setPlaybackDismissVersion(1)}
        >
          <div className="flex items-center gap-2">
            <SceneActions actions={playbackActions} />
          </div>
        </FloatingPanel>
      )}
    </div>
  )
}
