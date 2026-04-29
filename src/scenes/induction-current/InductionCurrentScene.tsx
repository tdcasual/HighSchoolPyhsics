import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import type { PresentationFocus } from '../../scene3d/presentationCamera'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { InductionCurrentControls } from './InductionCurrentControls'
import { InductionCurrentRig3D } from './InductionCurrentRig3D'
import {
  formatCurrentDirection,
  formatFluxChange,
  formatPoleSetting,
  formatVerticalDirection,
} from './model'
import { useInductionCurrentSceneState } from './useInductionCurrentSceneState'
import './induction-current.css'

export function InductionCurrentScene() {
  const state = useInductionCurrentSceneState()
  const presentationFocus = state.motionDirection || state.lastOutcome
    ? { mode: 'focus' as const, primary: [20, -4, 0] as [number, number, number] }
    : { mode: 'overview' as const }
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
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>磁极朝向: {formatPoleSetting(state.poleSetting)}</p>
          <p>磁铁状态: {motionStatusText}</p>
          <p>最新感应电流: {currentDirectionText}</p>
          <p>感应磁场方向: {latestInducedFieldDirection}</p>
          <p>实验记录: {state.records.length} 条</p>
        </div>
      }
      playback={
        <div className="induction-current-btn-row">
          <button
            type="button"
            className={`touch-target induction-current-action ${state.lastMotionDirection === 'approach' ? 'active' : ''}`.trim()}
            onClick={state.moveTowardsCoil}
            disabled={!state.canMoveTowardsCoil}
            aria-pressed={state.lastMotionDirection === 'approach'}
          >
            ↓ 向下运动 (接近)
          </button>
          <button
            type="button"
            className={`touch-target induction-current-action ${state.lastMotionDirection === 'recede' ? 'active' : ''}`.trim()}
            onClick={state.moveAwayFromCoil}
            disabled={!state.canMoveAwayFromCoil}
            aria-pressed={state.lastMotionDirection === 'recede'}
          >
            ↑ 向上运动 (远离)
          </button>
          <button
            type="button"
            className="touch-target induction-current-reset"
            onClick={state.resetExperiment}
          >
            ↺ 重置实验
          </button>
        </div>
      }
      viewport={
        <InteractiveCanvas
          camera={{ position: [25, 5, 65], fov: 40 }}
          controls={{ target: [20, -4, 0], minDistance: 24, maxDistance: 120 }}
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
