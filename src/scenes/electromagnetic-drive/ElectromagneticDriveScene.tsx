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
      controls={
        <ElectromagneticDriveControls
          isRunning={state.isRunning}
          start={state.start}
          pause={state.pause}
          reset={state.reset}
        />
      }
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>实验状态: {experimentStatus}</p>
          <p>磁铁转速: {magnetSpeedText}</p>
          <p>铝框转速: {frameSpeedText}</p>
          <p>转差 Δω: {formatAngularSpeed(state.magnetSpeed - state.frameSpeed)}</p>
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
      panelPlacement="after-sidebar"
      auxiliaryPanelPlacement="after-sidebar"
      dataInitiallyCollapsed
      chartInitiallyCollapsed
      chartOffsetY={230}
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
