import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import type { PresentationSignal } from '../../ui/layout/presentationSignals'
import { ElectromagneticDriveChart } from './ElectromagneticDriveChart'
import { ElectromagneticDriveControls } from './ElectromagneticDriveControls'
import { ElectromagneticDriveRig3D } from './ElectromagneticDriveRig3D'
import { formatAngularSpeed, formatLagRatio } from './model'
import { useElectromagneticDriveSceneState } from './useElectromagneticDriveSceneState'
import './electromagnetic-drive.css'

const presentationSignals: PresentationSignal[] = ['chart', 'live-metric', 'interactive-readout']

export function ElectromagneticDriveScene() {
  const state = useElectromagneticDriveSceneState()
  const experimentStatus = state.isRunning ? '摇动中' : '已停止'
  const magnetSpeedText = formatAngularSpeed(state.magnetSpeed)
  const frameSpeedText = formatAngularSpeed(state.frameSpeed)
  const lagRatioText = formatLagRatio(state.frameSpeed, state.magnetSpeed)
  const frameloop = state.isRunning || state.magnetSpeed > 0.01 || state.frameSpeed > 0.01
    ? 'always'
    : 'demand'

  return (
    <SceneLayout
      presentationSignals={presentationSignals}
      coreSummary={
        <div className="scene-core-summary-stack">
          <p>实验状态: {experimentStatus}</p>
          <p>磁铁转速: {magnetSpeedText}</p>
          <p>铝框转速: {frameSpeedText}</p>
          <p>跟随比: {lagRatioText}</p>
        </div>
      }
      controls={<ElectromagneticDriveControls state={state} />}
      viewport={
        <div className="electromagnetic-drive-viewport">
          <p className="electromagnetic-drive-scene-title">电磁驱动</p>

          <div className="electromagnetic-drive-stage-rail">
            <div className="electromagnetic-drive-stage-rail-head">
              <p className="electromagnetic-drive-stage-rail-title">实验看板</p>
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

            <section className="electromagnetic-drive-stage-note" aria-label="实验现象说明">
              <p className="electromagnetic-drive-stage-note-label">实验现象说明：</p>
              <div className="electromagnetic-drive-stage-note-card">
                <p><strong>1. 磁场旋转：</strong><br />点击开始，曲柄带动磁铁旋转。</p>
                <p><strong>2. 磁通量变化：</strong><br />旋转磁场切割闭合铝框。</p>
                <p><strong>3. 异步跟随：</strong><br />铝框产生感应电流并受力旋转，但速度略慢于磁铁。</p>
              </div>
            </section>

            <div className="electromagnetic-drive-chart-card" data-presentation-signal="chart">
              <ElectromagneticDriveChart
                magnetSpeeds={state.history.magnetSpeeds}
                frameSpeeds={state.history.frameSpeeds}
              />
            </div>
          </div>

          <InteractiveCanvas
            camera={{ position: [8.6, 14.1, 24.2], fov: 44 }}
            controls={{ target: [-6.4, 4.2, 0], minDistance: 12, maxDistance: 42 }}
            adaptiveFraming={false}
            frameloop={frameloop}
          >
            <ElectromagneticDriveRig3D magnetAngle={state.magnetAngle} frameAngle={state.frameAngle} />
          </InteractiveCanvas>
        </div>
      }
    />
  )
}

export default ElectromagneticDriveScene
