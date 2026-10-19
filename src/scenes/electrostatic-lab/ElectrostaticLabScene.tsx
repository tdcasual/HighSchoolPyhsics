import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { ElectrostaticLabControls } from './ElectrostaticLabControls'
import { ElectrostaticLabRig3D } from './ElectrostaticLabRig3D'
import { samplePotentialTerrainHeight } from './model'
import {
  ELECTROSTATIC_LAB_SCENE_BOUNDS,
  useElectrostaticLabState,
} from './useElectrostaticLabState'

export function ElectrostaticLabScene() {
  const state = useElectrostaticLabState()
  const resolveFocusHeight = (point: { x: number; z: number }) =>
    state.displayMode === 'potential'
      ? samplePotentialTerrainHeight(state.terrain, ELECTROSTATIC_LAB_SCENE_BOUNDS, point) + 0.2
      : 0.24
  const focusTarget = state.probePoint
    ? ([state.probePoint.x, resolveFocusHeight(state.probePoint), state.probePoint.z] as [number, number, number])
    : state.selectedCharge
      ? ([state.selectedCharge.x, resolveFocusHeight(state.selectedCharge), state.selectedCharge.z] as [number, number, number])
      : null
  const presentationFocus = focusTarget ? { mode: 'focus' as const, primary: focusTarget } : { mode: 'overview' as const }

  return (
    <SceneLayout
      controls={<ElectrostaticLabControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>
            <span>电荷方案</span>
            <strong>{state.presetLabel}（+{state.chargeSummary.positiveCount} / −{state.chargeSummary.negativeCount}）</strong>
          </p>
          <p>
            <span>相对电势范围</span>
            <strong>{state.terrain.stats.minPotential.toFixed(2)} ~ {state.terrain.stats.maxPotential.toFixed(2)}</strong>
          </p>
          <p><span>当前模式</span><strong>{state.modeLabel}</strong></p>
          <p>
            <span>探针读数（相对）</span>
            <strong>
              {state.probeReadout
                ? `φ = ${state.probeReadout.potential.toFixed(2)}，|E| = ${state.probeReadout.field.magnitude.toFixed(2)}`
                : '未放置'}
            </strong>
          </p>
        </div>
      }
      viewport={
        <InteractiveCanvas
          camera={{ position: [10, 10, 11], fov: 52 }}
          controls={{ target: [0, 0.4, 0], minDistance: 6, maxDistance: 30 }}
          presentationFocus={presentationFocus}
          adaptiveFraming={false}
          frameloop="demand"
        >
          <ElectrostaticLabRig3D
            bounds={ELECTROSTATIC_LAB_SCENE_BOUNDS}
            charges={state.charges}
            terrain={state.terrain}
            fieldLines={state.fieldLines}
            displayMode={state.displayMode}
            overlayFieldLines={state.overlayFieldLines}
            showContourLines={state.showContourLines}
            selectedChargeId={state.selectedChargeId}
            probeMode={state.probeMode}
            probePoint={state.probePoint}
            advancedInteractionsEnabled={state.advancedInteractionsEnabled}
            onSelectCharge={state.selectCharge}
            onProbePointChange={state.setProbePoint}
            onChargePositionChange={state.setChargePosition}
            onAddChargeAt={state.addChargeAtPoint}
            onDeleteCharge={state.deleteChargeById}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default ElectrostaticLabScene
