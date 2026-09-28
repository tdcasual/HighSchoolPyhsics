import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MOBILE_BREAKPOINT, useMediaQuery } from '../../ui/hooks/useMediaQuery'
import { shortestSignedAngleDeg } from './model'
import { OerstedControls } from './OerstedControls'
import { OerstedRig3D } from './OerstedRig3D'
import { OERSTED_PRESETS } from './oerstedPresets'
import { useOerstedSceneState } from './useOerstedSceneState'
import './oersted.css'

export function OerstedScene() {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)
  const state = useOerstedSceneState()
  const focusedNeedle = state.draggingNeedleIndex !== null ? state.visualNeedles[state.draggingNeedleIndex] ?? null : null
  const presentationFocus = focusedNeedle
    ? { mode: 'focus' as const, primary: [focusedNeedle.x, 0, focusedNeedle.z] as [number, number, number] }
    : { mode: 'overview' as const }

  return (
    <SceneLayout
      dataInitiallyCollapsed
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
          {state.previewNeedleStates.map((needleState, index) => {
            const actualSwingDeg = shortestSignedAngleDeg(
              state.initialHeadingDeg,
              state.visualNeedles[index]?.headingDeg ?? state.initialHeadingDeg,
            )
            return (
              <p key={'needle-reading-' + index} data-testid={'oersted-swing-' + (index + 1)}>
                磁针{index + 1}: 当前偏转{' '}
                <strong data-testid={'oersted-actual-swing-' + (index + 1)}>
                  {actualSwingDeg.toFixed(1)}°
                </strong>
                {' '}· 通电后目标{' '}
                <strong data-testid={'oersted-target-swing-' + (index + 1)}>
                  {needleState.observedSwingDeg.toFixed(1)}°
                </strong>
                {' '}· 通电后 B_wire,h{' '}
                <strong>{needleState.wireFieldMicroT.toFixed(1)} μT</strong>
              </p>
            )
          })}
          <p>
            通电后最大目标摆角: <strong>{state.maxSwing.toFixed(1)}°</strong>
          </p>
          <p>可观察性: {state.discoveryText}（通电后预测）</p>
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
          camera={{ position: isMobile ? [3.4, 2, 5.2] : [3.8, 2.3, 5.6], fov: 36 }}
          controls={{ target: isMobile ? [-0.25, 0, 0] : [0, 0, 0] }}
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

export default OerstedScene
