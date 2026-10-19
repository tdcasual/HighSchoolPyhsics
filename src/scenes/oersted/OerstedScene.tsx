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
        <div className="scene-core-summary-stack">
          <p><span>状态</span><strong>{state.running ? '通电演示中' : '待机观察'}</strong></p>
          <table className="oersted-needle-table">
            <thead>
              <tr>
                <th scope="col">磁针</th>
                <th scope="col">当前偏转</th>
                <th scope="col">通电后目标</th>
                <th scope="col">导线 B（水平）</th>
              </tr>
            </thead>
            <tbody>
              {state.previewNeedleStates.map((needleState, index) => {
                const actualSwingDeg = shortestSignedAngleDeg(
                  state.initialHeadingDeg,
                  state.visualNeedles[index]?.headingDeg ?? state.initialHeadingDeg,
                )
                return (
                  <tr key={'needle-reading-' + index} data-testid={'oersted-swing-' + (index + 1)}>
                    <th scope="row">{index + 1}</th>
                    <td data-testid={'oersted-actual-swing-' + (index + 1)}>{actualSwingDeg.toFixed(1)}°</td>
                    <td data-testid={'oersted-target-swing-' + (index + 1)}>{needleState.observedSwingDeg.toFixed(1)}°</td>
                    <td>{needleState.wireFieldMicroT.toFixed(1)} μT</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      }
      notes={
        <p>
          电流 I = {state.currentA.toFixed(1)} A，通电后最大目标摆角 {state.maxSwing.toFixed(1)}°；可观察性：{state.discoveryText}（通电后预测）。
        </p>
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
          camera={{ position: isMobile ? [3.4, 2, 5.2] : [3.55, 2.75, 5.95], fov: 36 }}
          controls={{ target: isMobile ? [-0.25, 0, 0] : [-0.25, 0.2, 0] }}
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
