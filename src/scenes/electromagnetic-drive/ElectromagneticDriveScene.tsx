import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { ElectromagneticDriveChart } from './ElectromagneticDriveChart'
import { ElectromagneticDriveControls } from './ElectromagneticDriveControls'
import { ElectromagneticDriveRig3D } from './ElectromagneticDriveRig3D'
import { formatAngularSpeed, formatLagRatio } from './model'
import { useElectromagneticDriveSceneState } from './useElectromagneticDriveSceneState'
import './electromagnetic-drive.css'

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
      controls={<ElectromagneticDriveControls />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>实验状态: {experimentStatus}</p>
          <p>磁铁转速: {magnetSpeedText}</p>
          <p>铝框转速: {frameSpeedText}</p>
          <p>跟随比: {lagRatioText}</p>
        </div>
      }
      chart={
        <ElectromagneticDriveChart
          magnetSpeeds={state.history.magnetSpeeds}
          frameSpeeds={state.history.frameSpeeds}
        />
      }
      chartVisible={true}
      playback={
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
      }
      viewport={
        <InteractiveCanvas
          camera={{ position: [8.6, 14.1, 24.2], fov: 44 }}
          controls={{ target: [-6.4, 4.2, 0], minDistance: 12, maxDistance: 42 }}
          adaptiveFraming={false}
          frameloop={frameloop}
        >
          <ElectromagneticDriveRig3D magnetAngle={state.magnetAngle} frameAngle={state.frameAngle} />
        </InteractiveCanvas>
      }
    />
  )
}

export default ElectromagneticDriveScene
