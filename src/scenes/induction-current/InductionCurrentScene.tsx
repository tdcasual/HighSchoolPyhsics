import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { InductionCurrentControls } from './InductionCurrentControls'
import { InductionCurrentRig3D } from './InductionCurrentRig3D'
import {
  formatCurrentDirection,
  formatPoleSetting,
  formatVerticalDirection,
} from './model'
import { useInductionCurrentSceneState } from './useInductionCurrentSceneState'
import './induction-current.css'

export function InductionCurrentScene() {
  const state = useInductionCurrentSceneState()
  const presentationFocus = state.motionDirection || state.lastOutcome
    ? { mode: 'focus' as const, primary: [7.5, -4, 0] as [number, number, number] }
    : { mode: 'overview' as const }
  const instantaneousCurrentText = !state.isMoving
    ? '0（磁铁静止）'
    : state.coilCurrentSign === 0
      ? '接近零'
      : formatCurrentDirection(state.coilCurrentSign > 0 ? 'counterclockwise' : 'clockwise')
  const currentDirectionText = state.lastOutcome
    ? formatCurrentDirection(state.lastOutcome.inducedCurrentDirection)
    : '无'
  const motionStatusText = state.motionDirection
    ? state.motionDirection === 'approach'
      ? '向线圈接近'
      : '远离线圈'
    : state.magnetPosition === 'near'
      ? '已在近端'
      : '已在远端'
  const latestInducedFieldDirection = state.lastOutcome
    ? formatVerticalDirection(state.lastOutcome.inducedFieldDirection)
    : '无'

  return (
    <SceneLayout
      controls={<InductionCurrentControls state={state} />}
      dataInitiallyCollapsed
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>磁极朝向: {formatPoleSetting(state.poleSetting)}</p>
          <p>磁铁状态: {motionStatusText}</p>
          <p>最近一次感应电流方向: {currentDirectionText}</p>
          <p>瞬时感应电流方向: {instantaneousCurrentText}</p>
          <p>仪表偏角（示意）: {(-state.needleAngleRad * (180 / Math.PI)).toFixed(1)}°</p>
          <p>感应磁场轴向: {latestInducedFieldDirection}</p>
          <p>实验记录: {state.records.length} 条</p>
        </div>
      }
      viewport={
        <InteractiveCanvas
          camera={{ position: [12.5, 5, 65], fov: 40 }}
          controls={{ target: [7.5, -4, 0], minDistance: 24, maxDistance: 120 }}
          presentationFocus={presentationFocus}
          adaptiveFraming={false}
          frameloop={state.motionDirection ? 'always' : 'demand'}
        >
          <InductionCurrentRig3D
            poleSetting={state.poleSetting}
            magnetY={state.magnetY}
            coilCurrent={state.coilCurrent}
            coilCurrentSign={state.coilCurrentSign}
            needleAngleRad={state.needleAngleRad}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default InductionCurrentScene
