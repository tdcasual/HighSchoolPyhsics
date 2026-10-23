import { DataRows } from '../../ui/panels/DataRows'
import { clockActions } from '../../simulation/clockActions'
import { useMemo } from 'react'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
import type { Vec3 } from '../../scene3d/orbitFraming'
import { boxAround } from '../../scene3d/useAutoFittedCamera'
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
  // The rod or frame sweeps a full turn, so frame the box it sweeps rather than one pose.
  const shot = useMemo(() => {
    const length = state.effectiveLengthM
    const visualLength = ROTATIONAL_EMF_VISUAL_UNITS_PER_METER * length
    const sweep =
      state.scenario === 'rod'
        ? Math.max(
            visualLength,
            Math.hypot(0.55 * visualLength, 0.55 * visualLength, (ROD_FIELD_SHAFT_LENGTH / 2 + 0.34) * length),
          )
        : Math.hypot(
            (FRAME_FIELD_SHAFT_LENGTH / 2 + 0.16) * length,
            0.75 * ROTATIONAL_EMF_VISUAL_UNITS_PER_METER * length,
            0.65 * ROTATIONAL_EMF_VISUAL_UNITS_PER_METER * length,
          )
    const bounds = boxAround([0, 0, 0], [sweep, sweep, sweep])
    if (state.viewMode === 'top') return { from: [0, 1, 0.001] as Vec3, to: [0, 0, 0] as Vec3, bounds, margin: 1.1 }
    return {
      from: (state.scenario === 'frame' ? [2.5, 3.6, 9] : [5.5, 4.8, 7.2]) as Vec3,
      to: [0, 0, 0] as Vec3,
      bounds,
      margin: 1.1,
    }
  }, [state.effectiveLengthM, state.scenario, state.viewMode])

  return (
    <SceneLayout
      timeControl
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
            {
              label: '已知 B · ω · L',
              value: (
                <>
                  {state.magneticFieldT.toFixed(1)} T · {state.angularSpeed.toFixed(1)} rad/s ·{' '}
                  {state.effectiveLengthM.toFixed(1)} m
                </>
              ),
            },
            { label: '感应电动势', value: state.emfMagnitudeLabel, answer: true },
          ]}
        />
      }
      playbackActions={clockActions(
        { running: state.running, toggle: state.toggleRunning, step: state.step },
        { stepLabel: '单步 15°', onReset: state.reset },
      )}
      viewport={
        <FittedCanvas
          shot={shot}
          refitKey={`${state.scenario}:${state.viewMode}:${state.effectiveLengthM}`}
          fov={state.viewMode === 'top' ? 30 : 38}
          cameraUp={state.viewMode === 'top' ? [0, 0, -1] : [0, 1, 0]}
          minDistance={2.5}
          maxDistance={40}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <RotationalEmfRig3D
            scenario={state.scenario}
            angleRad={state.angleRad}
            effectiveLengthM={state.effectiveLengthM}
          />
        </FittedCanvas>
      }
    />
  )
}

export default RotationalEmfScene
