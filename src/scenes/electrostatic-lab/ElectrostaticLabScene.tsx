import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { DataRows } from '../../ui/panels/DataRows'
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
        <DataRows
          rows={[
            { label: '电荷方案', value: <>{state.presetLabel}（+{state.chargeSummary.positiveCount} / −{state.chargeSummary.negativeCount}）</> },
            { label: '相对电势范围', value: <>{state.terrain.stats.minPotential.toFixed(2)} ~ {state.terrain.stats.maxPotential.toFixed(2)}</> },
            { label: '当前模式', value: state.modeLabel },
            { label: '探针读数（相对）', value: state.probeReadout
                ? `φ = ${state.probeReadout.potential.toFixed(2)}，|E| = ${state.probeReadout.field.magnitude.toFixed(2)}`
                : '未放置' },
          ]}
        />
      }
      viewport={
        <FittedCanvas
          shot={{ from: [10, 10, 11], to: [0, 0.4, 0] }}
          fov={52}
          minDistance={6}
          maxDistance={30}
          presentationFocus={presentationFocus}
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
        </FittedCanvas>
      }
    />
  )
}

export default ElectrostaticLabScene
