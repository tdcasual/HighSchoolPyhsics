import { useState, type ReactNode } from 'react'
import { SegmentedControl } from '../controls/SegmentedControl'
import { useMediaQuery, COMPACT_DESKTOP_BREAKPOINT, MOBILE_BREAKPOINT } from '../hooks/useMediaQuery'
import { useAppStore } from '../../store/useAppStore'
import { ModelNoteTargetContext } from '../notes/modelNoteTarget'
import { PredictionContext } from '../notes/predictionContext'
import { PLAYBACK_RATE_OPTIONS } from '../../scene3d/playbackRate'
import { clearSceneMemory } from '../../app/sceneMemory/sceneMemory'
import { DesktopSceneLayout } from './DesktopSceneLayout'
import { MobileSceneLayout } from './MobileSceneLayout'
import type { PlaybackAction } from './playbackAction'
import { usePlaybackShortcuts } from './usePlaybackShortcuts'
import { usePredictionRound } from './usePredictionRound'

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
  playbackActions?: PlaybackAction[]
  /** The scene's loop honours the shared playback rate: show 速度 1× / ½× / ¼× in the playback zone. */
  timeControl?: boolean
  chartVisible?: boolean
  /**
   * False when the chart is the question rather than its outcome (e.g. a scale students read):
   * prediction mode then leaves it visible, and the chart hides its own answer marks with
   * usePredictionMasked().
   */
  chartMaskable?: boolean
  /** 'figure': a reading figure (caliper, micrometer scale) that needs its full width. */
  chartVariant?: 'figure'
  chartInitiallyCollapsed?: boolean
}

/** The five-zone classroom layout every scene renders through (see AGENTS.md). */
export function SceneLayout({
  viewport,
  controls,
  dataOverlay,
  notes,
  chart,
  playbackActions,
  timeControl = false,
  chartVisible = false,
  chartMaskable = true,
  chartVariant,
  chartInitiallyCollapsed = false,
}: SceneLayoutProps) {
  const [notesTarget, setNotesTarget] = useState<HTMLDivElement | null>(null)
  const { prediction, chartMasked, revealChart, headerActions } = usePredictionRound(chartMaskable)
  usePlaybackShortcuts(playbackActions)
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  // On small desktops the chart starts collapsed so the 3D view keeps the room right of the
  // data panel; it opens on demand like everywhere else.
  const compactDesktop = useMediaQuery(COMPACT_DESKTOP_BREAKPOINT)

  const chartBody = chartMasked ? (
    <button type="button" className="chart-mask" onClick={revealChart}>
      图表含结论 · 点击显示
    </button>
  ) : (
    chart
  )
  const sidebar = (
    <>
      {controls}
      <ResetParamsButton />
      <details className="scene-notes">
        <summary className="touch-target">教师备注 · 模型与公式</summary>
        <div className="scene-notes-body">
          {notes}
          {/* Always mounted so <ModelNote>s inside the controls can portal into it; hidden by CSS when empty. */}
          <div className="scene-notes-portal" ref={setNotesTarget} />
        </div>
      </details>
    </>
  )
  const rateControl = timeControl ? <PlaybackRateControl /> : undefined

  return (
    <ModelNoteTargetContext.Provider value={notesTarget}>
      <PredictionContext.Provider value={prediction}>
        {isMobile ? (
          <MobileSceneLayout
            viewport={viewport}
            sidebar={sidebar}
            dataOverlay={dataOverlay}
            chart={chart && chartVisible ? chartBody : undefined}
            playbackActions={playbackActions}
            rateControl={rateControl}
          />
        ) : (
          <DesktopSceneLayout
            viewport={viewport}
            sidebar={sidebar}
            dataOverlay={dataOverlay}
            dataHeaderActions={headerActions}
            chart={chart ? chartBody : undefined}
            chartVisible={chartVisible}
            chartStartsCollapsed={chartInitiallyCollapsed || compactDesktop}
            chartVariant={chartVariant}
            playbackActions={playbackActions}
            rateControl={rateControl}
          />
        )}
      </PredictionContext.Provider>
    </ModelNoteTargetContext.Provider>
  )
}

/** 速度 1× / ½× / ¼×: the shell's slow motion, for scenes whose clock honours it. */
function PlaybackRateControl() {
  const playbackRate = useAppStore((s) => s.playbackRate)
  const setPlaybackRate = useAppStore((s) => s.setPlaybackRate)
  return (
    <div className="playback-rate" aria-label="播放速度">
      <span className="playback-rate-label">速度</span>
      <SegmentedControl
        options={PLAYBACK_RATE_OPTIONS}
        value={String(playbackRate)}
        onChange={(key) => setPlaybackRate(Number(key))}
      />
    </div>
  )
}

/** Parameters are remembered across scene switches; this is the way back to the defaults. */
function ResetParamsButton() {
  const activeScenePath = useAppStore((s) => s.activeScenePath)
  const bumpSceneEpoch = useAppStore((s) => s.bumpSceneEpoch)
  return (
    <button
      type="button"
      className="panel-text-button scene-reset-params"
      onClick={() => {
        clearSceneMemory(activeScenePath.replace(/^\//, ''))
        bumpSceneEpoch()
      }}
    >
      恢复默认参数
    </button>
  )
}
