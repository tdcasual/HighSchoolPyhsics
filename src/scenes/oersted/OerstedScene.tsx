import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { OerstedControls } from './OerstedControls'
import { OerstedRig3D } from './OerstedRig3D'
import { OERSTED_PRESETS } from './oerstedPresets'
import { useOerstedSceneState } from './useOerstedSceneState'
import './oersted.css'

export function OerstedScene() {
  const state = useOerstedSceneState()

  return (
    <SceneLayout
      presentationSignals={['interactive-readout']}
      coreSummary={
        <div className="scene-core-summary-stack">
          <p>状态: {state.running ? '通电演示中' : '待机观察'}</p>
          <p>电流 I: {state.currentA.toFixed(1)} A</p>
          <p>最大可见摆动: {state.maxSwing.toFixed(1)}°</p>
          <p>可观察性: {state.discoveryText}</p>
        </div>
      }
      controls={
        <OerstedControls
          presetButtons={OERSTED_PRESETS.map((preset) => ({
            id: preset.id,
            label: preset.label,
            active: state.activePresetId === preset.id,
            onClick: () => state.applyPreset(preset),
          }))}
          activePresetTip={state.activePresetTip}
          currentA={state.currentA}
          onCurrentChange={state.onCurrentChange}
          earthFieldMicroT={state.earthFieldMicroT}
          onEarthFieldChange={state.onEarthFieldChange}
          wireAzimuthDeg={state.wireAzimuthDeg}
          onWireAzimuthChange={state.onWireAzimuthChange}
          wirePitchDeg={state.wirePitchDeg}
          onWirePitchChange={state.onWirePitchChange}
          wireHeightM={state.wireHeightM}
          onWireHeightChange={state.onWireHeightChange}
          initialHeadingDeg={state.initialHeadingDeg}
          onInitialHeadingChange={state.onInitialHeadingChange}
          running={state.running}
          onToggleRunning={state.toggleRunning}
          onReset={state.resetNeedles}
          showFieldLines={state.showFieldLines}
          onToggleFieldLines={state.toggleFieldLines}
          previewNeedleStates={state.previewNeedleStates}
          maxSwing={state.maxSwing}
          discoveryText={state.discoveryText}
        />
      }
      viewport={
        <InteractiveCanvas
          camera={{ position: [3.8, 2.3, 5.6], fov: 42 }}
          frameloop={state.running || state.draggingNeedleIndex !== null ? 'always' : 'demand'}
          controlsEnabled={state.draggingNeedleIndex === null}
        >
          <OerstedRig3D
            running={state.running}
            currentA={state.running ? state.currentA : 0}
            wireHeightM={state.wireHeightM}
            wireDirection={state.wireDirection}
            phase={state.phase}
            showFieldLines={state.showFieldLines}
            needles={state.visualNeedles}
            draggingNeedleIndex={state.draggingNeedleIndex}
            onNeedleDragStart={state.startNeedleDrag}
            onNeedleDrag={state.setNeedlePlacementByDrag}
            onNeedleDragEnd={state.endNeedleDrag}
          />
        </InteractiveCanvas>
      }
    />
  )
}
