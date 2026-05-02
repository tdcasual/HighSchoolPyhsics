import { useMemo, useState, type ReactNode } from 'react'
import { FloatingPanel } from '../panels/FloatingPanel'
import { SidebarPanel } from '../panels/SidebarPanel'
import { SegmentedControl } from '../controls/SegmentedControl'
import { useMediaQuery } from '../hooks/useMediaQuery'

type SceneLayoutProps = {
  viewport: ReactNode
  controls: ReactNode
  dataOverlay?: ReactNode
  chart?: ReactNode
  playback?: ReactNode
  chartVisible?: boolean
}

type MobileTabKey = 'controls' | 'data' | 'chart'

const SIDEBAR_WIDTH = 320
const SIDEBAR_COLLAPSED_WIDTH = 40
const PANEL_GAP = 20
const MOBILE_BREAKPOINT = '(max-width: 767px)'
const TAB_CONTENT_MAX_HEIGHT_VH = 35
const FLOATING_CHART_DEFAULT_Y = 300
const FLOATING_PLAYBACK_DEFAULT_Y = 500

export function SceneLayout({
  viewport,
  controls,
  dataOverlay,
  chart,
  playback,
  chartVisible = false,
}: SceneLayoutProps) {
  const [chartDismissVersion, setChartDismissVersion] = useState(0)
  const [chartVisibleVersion, setChartVisibleVersion] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTabKey>('controls')
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)

  if (chartVisible && chartVisibleVersion === 0) {
    setChartVisibleVersion(1)
  }
  const showChart = chartVisible && chartVisibleVersion > chartDismissVersion
  const panelX = useMemo(
    () => (sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH) + PANEL_GAP,
    [sidebarCollapsed],
  )

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
        {playback && (
          <div className="shrink-0 flex flex-wrap items-center gap-2 px-2 py-1.5 border-b border-gray-200 dark:border-[#2f4863]">
            {playback}
          </div>
        )}

        <div className="flex-1 min-h-0">
          {viewport}
        </div>

        <div className="shrink-0 flex flex-col border-t border-gray-200 dark:border-[#2f4863]">
          <div className="px-2 pt-1.5">
            <SegmentedControl
              options={mobileTabOptions}
              value={effectiveMobileTab}
              onChange={(key) => setActiveMobileTab(key as MobileTabKey)}
            />
          </div>
          <div
            className="overflow-y-auto px-2 pb-2"
            style={{ maxHeight: `${TAB_CONTENT_MAX_HEIGHT_VH}vh` }}
          >
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
          defaultPosition={{ x: panelX, y: 0 }}
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
          defaultPosition={{ x: panelX, y: FLOATING_CHART_DEFAULT_Y }}
          offsetX={panelX}
          closable
          onClose={() => setChartDismissVersion(chartVisibleVersion)}
        >
          <div className="min-w-[300px]">
            {chart}
          </div>
        </FloatingPanel>
      )}

      {playback && (
        <FloatingPanel
          title="播放控制"
          defaultPosition={{ x: panelX, y: FLOATING_PLAYBACK_DEFAULT_Y }}
          offsetX={panelX}
          zIndex="z-20"
        >
          <div className="flex items-center gap-2">
            {playback}
          </div>
        </FloatingPanel>
      )}
    </div>
  )
}
