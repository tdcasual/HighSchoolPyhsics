import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { OerstedControls } from './OerstedControls'
import { OerstedRig3D } from './OerstedRig3D'
import { OERSTED_PRESETS } from './oerstedPresets'
import { useOerstedSceneState } from './useOerstedSceneState'
import './oersted.css'

export function OerstedScene() {
  const state = useOerstedSceneState()
  const focusedNeedle = state.draggingNeedleIndex !== null ? state.visualNeedles[state.draggingNeedleIndex] ?? null : null
  const presentationFocus = focusedNeedle
    ? { mode: 'focus' as const, primary: [focusedNeedle.x, 0, focusedNeedle.z] as [number, number, number] }
    : { mode: 'overview' as const }

  return (
    <SceneLayout
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
        />
      }
      dataOverlay={
        <div className="oersted-card">
          {state.previewNeedleStates.map((needleState, index) => (
            <p key={`needle-reading-${index}`} data-testid={`oersted-swing-${index + 1}`}>
              磁针{index + 1}: 摆动 <strong>{needleState.observedSwingDeg.toFixed(1)}°</strong> · Bwire{' '}
              <strong>{needleState.wireFieldMicroT.toFixed(1)} μT</strong>
            </p>
          ))}
          <p>
            最大可见摆动: <strong>{state.maxSwing.toFixed(1)}°</strong>
          </p>
          <p>可观察性: {state.discoveryText}</p>
          <p>状态: {state.running ? '通电演示中' : '待机观察'}</p>
          <p>电流 I: {state.currentA.toFixed(1)} A</p>
        </div>
      }
      playbackActions={[
        {
          key: 'toggle-running',
          label: state.running ? '断电' : '通电',
          onClick: state.toggleRunning,
        },
        {
          key: 'reset',
          label: '回到地磁初始位',
          onClick: state.resetNeedles,
        },
        {
          key: 'toggle-field-lines',
          label: state.showFieldLines ? '隐藏磁感线' : '显示磁感线',
          onClick: state.toggleFieldLines,
        },
      ]}
      viewport={
        <InteractiveCanvas
          camera={{ position: [3.8, 2.3, 5.6], fov: 42 }}
          presentationFocus={presentationFocus}
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
