import { useState } from 'react'
import { ElectromagneticDriveChart } from './ElectromagneticDriveChart'
import { formatAngularSpeed, formatLagRatio } from './model'
import type { ElectromagneticDriveSceneState } from './useElectromagneticDriveSceneState'

type ElectromagneticDriveControlsProps = {
  state: Pick<
    ElectromagneticDriveSceneState,
    'history' | 'frameSpeed' | 'isRunning' | 'magnetSpeed' | 'pause' | 'reset' | 'start'
  >
}

export function ElectromagneticDriveControls({ state }: ElectromagneticDriveControlsProps) {
  const [notesExpanded, setNotesExpanded] = useState(true)
  const [chartExpanded, setChartExpanded] = useState(true)

  const experimentStatus = state.isRunning ? '摇动中' : '已停止'
  const magnetSpeedText = formatAngularSpeed(state.magnetSpeed)
  const frameSpeedText = formatAngularSpeed(state.frameSpeed)
  const lagRatioText = formatLagRatio(state.frameSpeed, state.magnetSpeed)

  return (
    <div className="electromagnetic-drive-controls">
      <h2>电磁驱动控制</h2>

      <div className="electromagnetic-drive-button-grid">
        <button type="button" className="touch-target btn-start" onClick={state.start}>
          开始摇动
        </button>
        <button type="button" className="touch-target btn-pause" onClick={state.pause}>
          停止摇动
        </button>
        <button type="button" className="touch-target btn-reset" onClick={state.reset}>
          重置实验
        </button>
      </div>

      <section className="electromagnetic-drive-board" aria-label="实验看板">
        <div className="electromagnetic-drive-board-head">
          <div>
            <p className="electromagnetic-drive-board-title">实验看板</p>
            <p className="electromagnetic-drive-board-subtitle">保留原版读数、现象说明与转速图表，可按课堂需要局部折叠。</p>
          </div>
        </div>

        <div
          className="electromagnetic-drive-telemetry"
          data-presentation-signal="live-metric interactive-readout"
        >
          <p><span>实验状态</span><strong>{experimentStatus}</strong></p>
          <p><span>磁铁转速</span><strong>{magnetSpeedText}</strong></p>
          <p><span>铝框转速</span><strong>{frameSpeedText}</strong></p>
          <p><span>跟随比</span><strong>{lagRatioText}</strong></p>
        </div>

        <section className="electromagnetic-drive-section" aria-label="实验现象说明">
          <div className="electromagnetic-drive-section-head">
            <p className="electromagnetic-drive-stage-note-label">实验现象说明</p>
            <button
              type="button"
              className="touch-target electromagnetic-drive-section-toggle"
              aria-expanded={notesExpanded}
              onClick={() => setNotesExpanded((value) => !value)}
            >
              {notesExpanded ? '收起实验说明' : '显示实验说明'}
            </button>
          </div>

          {notesExpanded ? (
            <div className="electromagnetic-drive-stage-note-card">
              <p><strong>1. 磁场旋转：</strong><br />点击开始，曲柄带动磁铁旋转。</p>
              <p><strong>2. 磁通量变化：</strong><br />旋转磁场切割闭合铝框。</p>
              <p><strong>3. 异步跟随：</strong><br />铝框产生感应电流并受力旋转，但速度略慢于磁铁。</p>
            </div>
          ) : null}
        </section>

        <section className="electromagnetic-drive-section electromagnetic-drive-chart-section" aria-label="实时转速图表">
          <div className="electromagnetic-drive-section-head">
            <p className="electromagnetic-drive-stage-note-label">转速图表</p>
            <button
              type="button"
              className="touch-target electromagnetic-drive-section-toggle"
              aria-expanded={chartExpanded}
              onClick={() => setChartExpanded((value) => !value)}
            >
              {chartExpanded ? '收起转速图表' : '显示转速图表'}
            </button>
          </div>

          <div className="electromagnetic-drive-chart-card" data-presentation-signal="chart">
            {chartExpanded ? (
              <ElectromagneticDriveChart
                magnetSpeeds={state.history.magnetSpeeds}
                frameSpeeds={state.history.frameSpeeds}
              />
            ) : (
              <p className="electromagnetic-drive-chart-collapsed-note">图表已折叠，点击展开查看磁铁与铝框转速曲线。</p>
            )}
          </div>
        </section>
      </section>
    </div>
  )
}
