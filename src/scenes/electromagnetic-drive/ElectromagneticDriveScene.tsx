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
  const isCoasting = state.magnetSpeed > 0.01 || state.frameSpeed > 0.01
  const experimentStatus = state.isRunning ? '摇动中' : isCoasting ? '惯性滑行中' : '静止'
  const magnetSpeedText = formatAngularSpeed(state.magnetSpeed)
  const frameSpeedText = formatAngularSpeed(state.frameSpeed)
  const lagRatioText = state.magnetSpeed > 0.001
    ? formatLagRatio(state.frameSpeed, state.magnetSpeed)
    : state.frameSpeed > 0.001 ? '磁铁近静止，铝框惯性滑行' : '0%'
  const frameloop = state.isRunning || state.magnetSpeed > 0.01 || state.frameSpeed > 0.01
    ? 'always'
    : 'demand'

  return (
    <SceneLayout
      controls={<ElectromagneticDriveControls />}
      playbackActions={[
        { key: 'toggle-running', label: state.isRunning ? '停止摇动' : '开始摇动', onClick: state.isRunning ? state.pause : state.start },
        { key: 'reset', label: '重置实验', onClick: state.reset },
      ]}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p><span>实验状态</span><strong>{experimentStatus}</strong></p>
          <p><span>磁铁转速</span><strong>{magnetSpeedText}</strong></p>
          <p><span>铝框转速</span><strong>{frameSpeedText}</strong></p>
          <p><span>转差 Δω</span><strong>{formatAngularSpeed(state.magnetSpeed - state.frameSpeed)}</strong></p>
          <p><span>跟随比</span><strong>{lagRatioText}</strong></p>
        </div>
      }
      chart={
        <ElectromagneticDriveChart
          magnetSpeeds={state.history.magnetSpeeds}
          frameSpeeds={state.history.frameSpeeds}
        />
      }
      chartVisible={true}
      chartInitiallyCollapsed
      viewport={
        <InteractiveCanvas
          camera={{ position: [1.2, 11.7, 18.2], fov: 42 }}
          controls={{ target: [-10.08, 4.2, 0], minDistance: 12, maxDistance: 42 }}
          adaptiveFraming={false}
          frameloop={frameloop}
        >
          <ElectromagneticDriveRig3D
            magnetAngle={state.magnetAngle}
            frameAngle={state.frameAngle}
            magnetSpeed={state.magnetSpeed}
            frameSpeed={state.frameSpeed}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default ElectromagneticDriveScene
