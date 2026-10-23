import { useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SegmentedControl } from '../controls/SegmentedControl'
import { HeaderActionsTargetContext } from './headerActionsTarget'
import type { PlaybackAction } from './playbackAction'

type MobileTabKey = 'controls' | 'data' | 'chart'

type MobileSceneLayoutProps = {
  viewport: ReactNode
  sidebar: ReactNode
  dataOverlay?: ReactNode
  /** The chart, or its prediction-mode cover; undefined when the scene shows none now. */
  chart?: ReactNode
  playbackActions?: PlaybackAction[]
  rateControl?: ReactNode
}

/**
 * Phones (≤767 px): the 3D view above a fixed bottom panel with 参数 / 数据 / 图表 tabs; the
 * playback buttons move into the app header.
 */
export function MobileSceneLayout({
  viewport,
  sidebar,
  dataOverlay,
  chart,
  playbackActions,
  rateControl,
}: MobileSceneLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTabKey>('controls')
  const headerSlot = useContext(HeaderActionsTargetContext)
  const tabs: Array<{ key: MobileTabKey; label: string }> = [{ key: 'controls', label: '参数' }]
  if (dataOverlay) tabs.push({ key: 'data', label: '数据' })
  if (chart) tabs.push({ key: 'chart', label: '图表' })
  const tab = tabs.some((t) => t.key === activeTab) ? activeTab : 'controls'

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 min-h-0">{viewport}</div>

      <div
        className="mobile-bottom-panel shrink-0 flex flex-col border-t"
        style={{ height: tab === 'controls' ? '30vh' : '46vh' }}
      >
        {dataOverlay && tab === 'controls' && <div className="mobile-data-strip">{dataOverlay}</div>}
        <div className="px-2 pt-1.5 shrink-0">
          <SegmentedControl options={tabs} value={tab} onChange={(key) => setActiveTab(key as MobileTabKey)} />
        </div>
        {rateControl && <div className="px-2 pt-2 shrink-0">{rateControl}</div>}
        <div className="sidebar-body flex-1 overflow-y-auto px-3 pt-2 pb-3">
          {tab === 'controls' && sidebar}
          {tab === 'data' && dataOverlay}
          {tab === 'chart' && chart}
        </div>
      </div>

      {headerSlot &&
        playbackActions &&
        createPortal(
          playbackActions.map((action) => (
            <button
              key={action.key}
              type="button"
              className="touch-target scene-actions-btn"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          )),
          headerSlot,
        )}
    </div>
  )
}
