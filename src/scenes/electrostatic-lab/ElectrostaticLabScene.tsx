import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { ElectrostaticLabControls } from './ElectrostaticLabControls'
import { ElectrostaticLabRig3D } from './ElectrostaticLabRig3D'
import {
  ELECTROSTATIC_LAB_SCENE_BOUNDS,
  useElectrostaticLabState,
} from './useElectrostaticLabState'

export function ElectrostaticLabScene() {
  const state = useElectrostaticLabState()
  const focusTarget = state.probePoint
    ? ([state.probePoint.x, 0.24, state.probePoint.z] as [number, number, number])
    : state.selectedCharge
      ? ([state.selectedCharge.x, 0.24, state.selectedCharge.z] as [number, number, number])
      : null
  const presentationFocus = focusTarget ? { mode: 'focus' as const, primary: focusTarget } : { mode: 'overview' as const }

  return (
    <SceneLayout
      controls={<ElectrostaticLabControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>
            电荷方案: {state.presetLabel}（+{state.chargeSummary.positiveCount} / -
            {state.chargeSummary.negativeCount}）
          </p>
          <p>
            势场范围: {state.terrain.stats.minPotential.toFixed(2)} ~{' '}
            {state.terrain.stats.maxPotential.toFixed(2)}
          </p>
          <p>当前模式: {state.modeLabel}</p>
          <p>
            探针读数:{' '}
            {state.probeReadout
              ? `V=${state.probeReadout.potential.toFixed(2)}, |E|=${state.probeReadout.field.magnitude.toFixed(2)}`
              : '未放置'}
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
