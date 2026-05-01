import { useMemo, useState, type ReactNode } from 'react'
import { FloatingPanel } from '../panels/FloatingPanel'
import { SidebarPanel } from '../panels/SidebarPanel'

type SceneLayoutProps = {
  viewport: ReactNode
  controls: ReactNode
  dataOverlay?: ReactNode
  chart?: ReactNode
  playback?: ReactNode
  chartVisible?: boolean
}

const SIDEBAR_WIDTH = 320
const SIDEBAR_COLLAPSED_WIDTH = 40
const PANEL_GAP = 20

export function SceneLayout({
  viewport,
  controls,
  dataOverlay,
  chart,
  playback,
  chartVisible = false,
}: SceneLayoutProps) {
  const [chartDismissed, setChartDismissed] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const showChart = chartVisible && !chartDismissed
  const panelX = useMemo(
    () => (sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH) + PANEL_GAP,
    [sidebarCollapsed],
  )

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Animation zone: full-screen base layer */}
      <div className="absolute inset-0 z-0">
        {viewport}
      </div>

      {/* Parameter sidebar */}
      <SidebarPanel
        title="参数控制"
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      >
        {controls}
      </SidebarPanel>

      {/* Data floating panel — top-right area */}
      {dataOverlay && (
        <FloatingPanel
          title="数据"
          defaultPosition={{ x: panelX, y: 0 }}
        >
          <div className="min-w-[200px]">
            {dataOverlay}
          </div>
        </FloatingPanel>
      )}

      {/* Chart floating panel — below data panel */}
      {chart && showChart && (
        <FloatingPanel
          title="图表"
          defaultPosition={{ x: panelX, y: 300 }}
          closable
          onClose={() => setChartDismissed(true)}
        >
          <div className="min-w-[300px]">
            {chart}
          </div>
        </FloatingPanel>
      )}

      {/* Playback floating panel — bottom area */}
      {playback && (
        <FloatingPanel
          title="播放控制"
          defaultPosition={{ x: panelX, y: 500 }}
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
