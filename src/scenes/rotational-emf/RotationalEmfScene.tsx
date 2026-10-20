import { DataRows } from '../../ui/panels/DataRows'
import { clockActions } from '../../simulation/clockActions'
import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { RotationalEmfControls } from './RotationalEmfControls'
import {
  FRAME_FIELD_SHAFT_LENGTH,
  ROD_FIELD_SHAFT_LENGTH,
  ROTATIONAL_EMF_VISUAL_UNITS_PER_METER,
  RotationalEmfRig3D,
} from './RotationalEmfRig3D'
import { useRotationalEmfSceneState } from './useRotationalEmfSceneState'

export function RotationalEmfScene() {
  const state = useRotationalEmfSceneState()
  const activeCameraPreset = useMemo(() => {
    const length = state.effectiveLengthM
    const visualLength = ROTATIONAL_EMF_VISUAL_UNITS_PER_METER * length
    const maxDimension = state.scenario === 'rod'
      ? Math.max(
          2 * visualLength,
          2 * Math.hypot(
            0.55 * visualLength,
            0.55 * visualLength,
            (ROD_FIELD_SHAFT_LENGTH / 2 + 0.34) * length,
          ),
        )
      : 2 * Math.hypot(
          (FRAME_FIELD_SHAFT_LENGTH / 2 + 0.16) * length,
          0.75 * ROTATIONAL_EMF_VISUAL_UNITS_PER_METER * length,
          0.65 * ROTATIONAL_EMF_VISUAL_UNITS_PER_METER * length,
        )

    if (state.viewMode === 'top') {
      const fov = 30
      const distance = Math.max(4, maxDimension / (2 * Math.tan((fov * Math.PI) / 360)) * 1.12)
      return {
        camera: { position: [0, distance, 0.001] as [number, number, number], fov },
        cameraUp: [0, 0, -1] as [number, number, number],
        controls: { target: [0, 0, 0] as [number, number, number], minDistance: Math.max(2.5, distance * 0.45), maxDistance: distance * 2 },
      }
    }

    const fov = 38
    const distance = Math.max(4, maxDimension / (2 * Math.tan((fov * Math.PI) / 360)) * 1.12)
    const basePosition = state.scenario === 'frame' ? [2.5, 3.6, 9] : [5.5, 4.8, 7.2]
    const baseDistance = Math.hypot(...basePosition)
    const scale = distance / baseDistance
    return {
      camera: { position: basePosition.map((value) => value * scale) as [number, number, number], fov },
      cameraUp: [0, 1, 0] as [number, number, number],
      controls: { target: [0, 0, 0] as [number, number, number], minDistance: Math.max(2.5, distance * 0.45), maxDistance: distance * 2 },
    }
  }, [state.effectiveLengthM, state.scenario, state.viewMode])

  return (
    <SceneLayout timeControl
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
        <DataRows
          rows={[
            { label: '实验类型', value: state.scenarioLabel },
            { label: '当前视图', value: state.viewLabel },
            { label: '当前转角', value: state.angleLabel },
            { label: '已知 B · ω · L', value: <>{state.magneticFieldT.toFixed(1)} T · {state.angularSpeed.toFixed(1)} rad/s · {state.effectiveLengthM.toFixed(1)} m</> },
            { label: '感应电动势', value: state.emfMagnitudeLabel, answer: true },
          ]}
        />
      }
      playbackActions={clockActions(
        { running: state.running, toggle: state.toggleRunning, step: state.step },
        { stepLabel: '单步 15°', onReset: state.reset },
      )}
      viewport={
        <InteractiveCanvas
          camera={activeCameraPreset.camera}
          cameraUp={activeCameraPreset.cameraUp}
          controls={activeCameraPreset.controls}
          syncCamera
          adaptiveFraming={false}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <RotationalEmfRig3D scenario={state.scenario} angleRad={state.angleRad} effectiveLengthM={state.effectiveLengthM} />
        </InteractiveCanvas>
      }
    />
  )
}

export default RotationalEmfScene
