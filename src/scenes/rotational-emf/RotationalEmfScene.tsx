import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { RotationalEmfControls } from './RotationalEmfControls'
import { RotationalEmfRig3D } from './RotationalEmfRig3D'
import { useRotationalEmfSceneState } from './useRotationalEmfSceneState'

const CAMERA_PRESETS = {
  main: {
    camera: { position: [5.5, 4.8, 7.2] as [number, number, number], fov: 38 },
    controls: { target: [0, 0, 0] as [number, number, number], minDistance: 4, maxDistance: 20 },
  },
  top: {
    camera: { position: [0, 9.5, 0.001] as [number, number, number], up: [0, 0, -1] as [number, number, number], fov: 30 },
    controls: { target: [0, 0, 0] as [number, number, number], minDistance: 4, maxDistance: 20 },
  },
} as const

export function RotationalEmfScene() {
  const state = useRotationalEmfSceneState()
  const activeCameraPreset = useMemo(() => CAMERA_PRESETS[state.viewMode], [state.viewMode])

  return (
    <SceneLayout
      controls={
        <RotationalEmfControls
          scenario={state.scenario}
          onScenarioChange={state.setScenario}
          viewMode={state.viewMode}
          onViewModeChange={state.setViewMode}
          magneticFieldT={state.magneticFieldT}
          onMagneticFieldChange={state.setMagneticFieldT}
          angularSpeed={state.angularSpeed}
          onAngularSpeedChange={state.setAngularSpeed}
          effectiveLengthM={state.effectiveLengthM}
          onEffectiveLengthChange={state.setEffectiveLengthM}
        />
      }
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>实验类型: {state.scenarioLabel}</p>
          <p>当前视图: {state.viewLabel}</p>
          <p>当前转角: {state.angleLabel}</p>
          <p>感应电动势: {state.emfMagnitudeLabel}</p>
        </div>
      }
      playbackActions={[
        {
          key: 'toggle-running',
          label: state.running ? '暂停' : '播放',
          onClick: state.toggleRunning,
        },
        {
          key: 'reset',
          label: '重置',
          onClick: state.reset,
        },
      ]}
      viewport={
        <InteractiveCanvas
          key={state.viewMode}
          camera={activeCameraPreset.camera}
          controls={activeCameraPreset.controls}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <RotationalEmfRig3D scenario={state.scenario} angleRad={state.angleRad} />
        </InteractiveCanvas>
      }
    />
  )
}

export default RotationalEmfScene
