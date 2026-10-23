import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { FloatingPanel } from '../panels/FloatingPanel'
import { SidebarPanel } from '../panels/SidebarPanel'
import { SceneActions } from '../controls/SceneActions'
import { useAppStore } from '../../store/useAppStore'
import type { PlaybackAction } from './playbackAction'
import { usePanelStack } from './usePanelStack'

const SIDEBAR_WIDTH = 320
const SIDEBAR_COLLAPSED_WIDTH = 44
const PANEL_GAP = 20
const STACK_GAP = 12

type DesktopSceneLayoutProps = {
  viewport: ReactNode
  sidebar: ReactNode
  dataOverlay?: ReactNode
  dataHeaderActions?: ReactNode
  /** The chart, or its prediction-mode cover. */
  chart?: ReactNode
  chartVisible: boolean
  chartStartsCollapsed: boolean
  chartVariant?: 'figure'
  playbackActions?: PlaybackAction[]
  rateControl?: ReactNode
}

/**
 * Desktop and tablet: the 3D view fills the screen, the sidebar sits on the left, and data →
 * chart → playback stack in one column right of it, leaving the rest as one uncovered area.
 */
export function DesktopSceneLayout({
  viewport,
  sidebar,
  dataOverlay,
  dataHeaderActions,
  chart,
  chartVisible,
  chartStartsCollapsed,
  chartVariant,
  playbackActions,
  rateControl,
}: DesktopSceneLayoutProps) {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed)
  const [chartClosed, setChartClosed] = useState(false)
  const [playbackClosed, setPlaybackClosed] = useState(false)
  const { attachData, attachChart, attachPlayback, heights } = usePanelStack()

  // A chart that comes back (chartVisible false → true) opens again even if it was closed before.
  const wasChartVisible = useRef(chartVisible)
  useLayoutEffect(() => {
    if (chartVisible && !wasChartVisible.current) setChartClosed(false)
    wasChartVisible.current = chartVisible
  }, [chartVisible])

  const showChart = Boolean(chart) && chartVisible && !chartClosed
  const chartDismissed = Boolean(chart) && chartVisible && chartClosed
  const hasPlayback = Boolean(playbackActions || rateControl)
  const playbackDismissed = hasPlayback && playbackClosed
  const panelX = (sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH) + PANEL_GAP
  const chartY = dataOverlay ? (heights[0] ?? 0) + STACK_GAP : 0
  const playbackY = chartY + (showChart ? (heights[1] ?? 0) + STACK_GAP : 0)

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 z-0">{viewport}</div>

      <SidebarPanel title="参数控制" collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed}>
        {sidebar}
      </SidebarPanel>

      {dataOverlay && (
        <FloatingPanel
          title="数据"
          zone="data"
          headerActions={dataHeaderActions}
          ref={attachData}
          defaultPosition={{ x: 0, y: 0 }}
          offsetX={panelX}
        >
          <div className="min-w-[200px]">{dataOverlay}</div>
        </FloatingPanel>
      )}

      {showChart && (
        <FloatingPanel
          key={chartStartsCollapsed ? 'chart-collapsed' : 'chart-expanded'}
          title="图表"
          zone="chart"
          ref={attachChart}
          defaultCollapsed={chartStartsCollapsed}
          defaultPosition={{ x: 0, y: chartY }}
          offsetX={panelX}
          closable
          onClose={() => setChartClosed(true)}
          resizable
        >
          <div
            className={
              chartVariant ? `scene-chart-content scene-chart-content--${chartVariant}` : 'scene-chart-content'
            }
          >
            {chart}
          </div>
        </FloatingPanel>
      )}

      {hasPlayback && !playbackDismissed && (
        <FloatingPanel
          title="播放控制"
          zone="playback"
          ref={attachPlayback}
          defaultPosition={{ x: 0, y: playbackY }}
          offsetX={panelX}
          zIndex="z-20"
          closable
          onClose={() => setPlaybackClosed(true)}
        >
          <div className="flex flex-col gap-3">
            {rateControl}
            {playbackActions && (
              <div className="flex items-center gap-2">
                <SceneActions actions={playbackActions} />
              </div>
            )}
          </div>
        </FloatingPanel>
      )}

      {(chartDismissed || playbackDismissed) && (
        <div
          className="panel-restore-dock scene-actions absolute z-20"
          style={{ left: panelX }}
          role="toolbar"
          aria-label="已关闭的面板"
        >
          {chartDismissed && (
            <button type="button" className="touch-target" onClick={() => setChartClosed(false)}>
              显示图表
            </button>
          )}
          {playbackDismissed && (
            <button type="button" className="touch-target" onClick={() => setPlaybackClosed(false)}>
              显示播放控制
            </button>
          )}
        </div>
      )}
    </div>
  )
}
