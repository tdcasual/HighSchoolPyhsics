import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { clockActions } from '../../simulation/clockActions'
import { DataRows } from '../../ui/panels/DataRows'
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
  const experimentStatus = state.frozen
    ? '定格（单步）'
    : state.isRunning
      ? '摇动中'
      : isCoasting
        ? '惯性滑行中'
        : '静止'
  const magnetSpeedText = formatAngularSpeed(state.magnetSpeed)
  const frameSpeedText = formatAngularSpeed(state.frameSpeed)
  const lagRatioText =
    state.magnetSpeed > 0.001
      ? formatLagRatio(state.frameSpeed, state.magnetSpeed)
      : state.frameSpeed > 0.001
        ? '磁铁近静止，铝框惯性滑行'
        : '0%'
  const frameloop = state.ticking ? 'always' : 'demand'

  return (
    <SceneLayout
      timeControl
      controls={<ElectromagneticDriveControls />}
      playbackActions={clockActions(
        {
          running: state.isRunning && !state.frozen,
          toggle: state.frozen ? state.resume : state.isRunning ? state.pause : state.start,
          step: state.step,
        },
        {
          playLabel: state.frozen ? '继续' : '开始摇动',
          pauseLabel: '停止摇动',
          stepLabel: '单步 0.1 s',
          resetLabel: '重置实验',
          onReset: state.reset,
        },
      )}
      dataOverlay={
        <DataRows
          rows={[
            { label: '实验状态', value: experimentStatus },
            { label: '磁铁转速', value: magnetSpeedText },
            { label: '铝框转速', value: frameSpeedText },
            { label: '转差 Δω', value: formatAngularSpeed(state.magnetSpeed - state.frameSpeed) },
            { label: '跟随比', value: lagRatioText },
          ]}
        />
      }
      chart={
        <ElectromagneticDriveChart magnetSpeeds={state.history.magnetSpeeds} frameSpeeds={state.history.frameSpeeds} />
      }
      chartVisible={true}
      chartInitiallyCollapsed
      viewport={
        <FittedCanvas
          shot={{ from: [1.2, 11.7, 18.2], to: [-10.08, 4.2, 0] }}
          fov={42}
          minDistance={12}
          maxDistance={42}
          frameloop={frameloop}
        >
          <ElectromagneticDriveRig3D
            magnetAngle={state.magnetAngle}
            frameAngle={state.frameAngle}
            magnetSpeed={state.magnetSpeed}
            frameSpeed={state.frameSpeed}
          />
        </FittedCanvas>
      }
    />
  )
}

export default ElectromagneticDriveScene
