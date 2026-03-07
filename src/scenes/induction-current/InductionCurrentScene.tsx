import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { InductionCurrentControls } from './InductionCurrentControls'
import { InductionCurrentRig3D } from './InductionCurrentRig3D'
import {
  formatCurrentDirection,
  formatPoleSetting,
} from './model'
import { useInductionCurrentSceneState } from './useInductionCurrentSceneState'
import './induction-current.css'

export function InductionCurrentScene() {
  const state = useInductionCurrentSceneState()
  const presentationIntent = {
    moment: state.lastOutcome ? 'result' : state.motionDirection ? 'focus' : 'overview',
    preferredLayout: state.motionDirection ? 'viewport' : 'split',
  } as const
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

  return (
    <SceneLayout
      presentationSignals={['interactive-readout', 'live-metric']}
      presentationIntent={presentationIntent}
      coreSummary={
        <div className="scene-core-summary-stack">
          <p>磁极朝向: {formatPoleSetting(state.poleSetting)}</p>
          <p>磁铁状态: {motionStatusText}</p>
          <p>最新感应电流: {currentDirectionText}</p>
          <p>实验记录: {state.records.length} 条</p>
        </div>
      }
      controls={<InductionCurrentControls state={state} />}
      viewport={
        <div className="induction-current-viewport-stack">
          <p className="induction-current-scene-title">探究影响感应电流方向的因素</p>
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
        </div>
      }
    />
  )
}

export default InductionCurrentScene
