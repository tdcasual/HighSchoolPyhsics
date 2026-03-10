import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import type { PresentationSignal } from '../../ui/layout/presentationSignals'
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
