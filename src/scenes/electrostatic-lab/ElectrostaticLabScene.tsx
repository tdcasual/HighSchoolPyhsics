import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { ElectrostaticLabControls } from './ElectrostaticLabControls'
import { ElectrostaticLabRig3D } from './ElectrostaticLabRig3D'
import {
  ELECTROSTATIC_LAB_SCENE_BOUNDS,
  useElectrostaticLabState,
} from './useElectrostaticLabState'
import './electrostatic-lab.css'

export function ElectrostaticLabScene() {
  const state = useElectrostaticLabState()

  return (
    <SceneLayout
      presentationSignals={['chart', 'live-metric', 'interactive-readout']}
      coreSummary={
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
      controls={<ElectrostaticLabControls state={state} />}
      viewport={
        <>
          <InteractiveCanvas
            camera={{ position: [10, 10, 11], fov: 52 }}
            controls={{ target: [0, 0.4, 0], minDistance: 6, maxDistance: 30 }}
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
          <p className="electrostatic-lab-viewport-note" data-presentation-signal="chart">
            操作提示：先选课堂预设，再切换“电势地形/电场线”；探针模式下点击地面任意点可读取电势与场强。
          </p>
        </>
      }
    />
  )
}
