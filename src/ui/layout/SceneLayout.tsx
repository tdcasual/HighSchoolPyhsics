import { useEffect, useState, type ReactNode } from 'react'
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

export function SceneLayout({
  viewport,
  controls,
  dataOverlay,
  chart,
  playback,
  chartVisible = false,
}: SceneLayoutProps) {
  const [showChart, setShowChart] = useState(chartVisible)

  useEffect(() => {
    setShowChart(chartVisible)
  }, [chartVisible])

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Animation zone: full-screen base layer */}
      <div className="absolute inset-0 z-0">
        {viewport}
      </div>

      {/* Parameter sidebar */}
      <SidebarPanel title="参数控制">
        {controls}
      </SidebarPanel>

      {/* Data floating panel — top-right area */}
      {dataOverlay && (
        <FloatingPanel
          title="数据"
          defaultPosition={{ x: 0, y: 0 }}
        >
          <div className="p-3 min-w-[200px]">
            {dataOverlay}
          </div>
        </FloatingPanel>
      )}

      {/* Chart floating panel — bottom-right area */}
      {chart && showChart && (
        <FloatingPanel
          title="图表"
          defaultPosition={{ x: 0, y: 300 }}
          closable
          onClose={() => setShowChart(false)}
        >
          <div className="p-3 min-w-[300px]">
            {chart}
          </div>
        </FloatingPanel>
      )}

      {/* Playback floating panel — bottom-left area */}
      {playback && (
        <FloatingPanel
          title="播放控制"
          defaultPosition={{ x: 340, y: 0 }}
          zIndex="z-20"
        >
          <div className="p-3 flex items-center gap-2">
            {playback}
          </div>
        </FloatingPanel>
      )}
    </div>
  )
}
