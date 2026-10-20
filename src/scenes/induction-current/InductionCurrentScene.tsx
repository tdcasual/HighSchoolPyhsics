import { DataRows } from '../../ui/panels/DataRows'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { InductionCurrentControls } from './InductionCurrentControls'
import { InductionCurrentRig3D } from './InductionCurrentRig3D'
import {
  formatCurrentDirection,
  formatVerticalDirection,
} from './model'
import { useInductionCurrentSceneState } from './useInductionCurrentSceneState'
import './induction-current.css'

export function InductionCurrentScene() {
  const state = useInductionCurrentSceneState()
  // While the magnet moves, the camera eases toward the coil.
  const cameraTarget: [number, number, number] = [7.5, 3, 0]
  const presentationFocus = state.motionDirection || state.lastOutcome
    ? { mode: 'focus' as const, primary: cameraTarget }
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
    <SceneLayout timeControl
      controls={<InductionCurrentControls state={state} />}
      notes={
        <p>
          磁铁移近时 |Φ| 增加，移远时 |Φ| 减少；表针和线圈箭头表示感应电流的方向与相对变化快慢。顺时针/逆时针以从线圈上方沿线圈轴线俯视为准，强弱为定性示意，不是校准电流读数。
        </p>
      }
      playbackActions={[
        { key: 'approach', label: '↓ 接近', onClick: state.moveTowardsCoil, disabled: !state.canMoveTowardsCoil },
        { key: 'recede', label: '↑ 远离', onClick: state.moveAwayFromCoil, disabled: !state.canMoveAwayFromCoil },
        { key: 'reset', label: '↺ 重置', onClick: state.resetExperiment },
      ]}
      dataOverlay={
        <DataRows
          rows={[
            { label: '磁铁状态', value: motionStatusText },
            { label: '最近一次感应电流方向', value: currentDirectionText, answer: true },
            { label: '瞬时感应电流方向', value: instantaneousCurrentText, answer: true },
            { label: '感应磁场轴向', value: latestInducedFieldDirection, answer: true },
            { label: '实验记录', value: <>{state.records.length} 条</> },
          ]}
        />
      }
      viewport={
        <FittedCanvas
          shot={{ from: [12.5, 12, 64], to: cameraTarget }}
          fov={40}
          minDistance={24}
          maxDistance={120}
          far={400}
          presentationFocus={presentationFocus}
          frameloop={state.motionDirection ? 'always' : 'demand'}
        >
          <InductionCurrentRig3D
            poleSetting={state.poleSetting}
            magnetY={state.magnetY}
            coilCurrent={state.coilCurrent}
            coilCurrentSign={state.coilCurrentSign}
            needleAngleRad={state.needleAngleRad}
          />
        </FittedCanvas>
      }
    />
  )
}

export default InductionCurrentScene
