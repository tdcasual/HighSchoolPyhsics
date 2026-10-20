import { DataRows } from '../../ui/panels/DataRows'
import { clockActions } from '../../simulation/clockActions'
import { useMemo, useState } from 'react'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
import type { Vec3 } from '../../scene3d/orbitFraming'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MotionalEmfControls } from './MotionalEmfControls'
import { MotionalEmfRig3D } from './MotionalEmfRig3D'
import { useMotionalEmfSceneState } from './useMotionalEmfSceneState'
import './motional-emf.css'

type CameraViewPreset = 'default' | 'top' | 'bottom'

/** Viewing directions (camera position → point looked at); the distance is fitted to the free area. */
const CAMERA_PRESETS: Record<CameraViewPreset, { from: Vec3; to: Vec3; up: Vec3; fov: number }> = {
  default: { from: [3.65, 2.55, 10.8], to: [1.5, 0.25, 0.7], up: [0, 1, 0], fov: 38 },
  top: { from: [2, 14.75, -0.999], to: [2, -0.25, -1], up: [0, 0, -1], fov: 40 },
  bottom: { from: [2, -15.25, -0.999], to: [2, -0.25, -1], up: [0, 0, 1], fov: 40 },
}

export function MotionalEmfScene() {
  const state = useMotionalEmfSceneState()
  const [cameraView, setCameraView] = useState<CameraViewPreset>('default')
  const activeCameraPreset = useMemo(() => CAMERA_PRESETS[cameraView], [cameraView])

  return (
    <SceneLayout timeControl
      controls={
        <>
          <MotionalEmfControls
            magneticFieldT={state.magneticFieldT}
            onMagneticFieldChange={state.setMagneticFieldT}
            magneticFieldDirection={state.magneticFieldDirection}
            onMagneticFieldDirectionChange={state.setMagneticFieldDirection}
            rodLengthM={state.rodLengthM}
            onRodLengthChange={state.setRodLengthM}
            speedMps={state.speedMps}
            onSpeedChange={state.setSpeedMps}
            rodAngleDeg={state.rodAngleDeg}
            onRodAngleChange={state.setRodAngleDeg}
            discussionMode={state.discussionMode}
            onDiscussionModeChange={state.setDiscussionMode}
            velocityPreset={state.velocityPreset}
            onVelocityPresetChange={state.setVelocityPreset}
            rodVelocityAngleDeg={state.rodVelocityAngleDeg}
            onRodVelocityAngleChange={state.setRodVelocityAngleDeg}
            motionDirection={state.motionDirection}
            onMotionDirectionChange={state.setMotionDirection}
          />

          <section className="motional-emf-view-card" aria-label="视角切换">
            <p className="motional-emf-view-card-title">视角</p>
            <div className="motional-emf-view-button-row">
              <button
                type="button"
                className={`touch-target motional-emf-view-button ${cameraView === 'default' ? 'active' : ''}`.trim()}
                onClick={() => setCameraView('default')}
              >
                默认视角
              </button>
              <button
                type="button"
                className={`touch-target motional-emf-view-button ${cameraView === 'top' ? 'active' : ''}`.trim()}
                onClick={() => setCameraView('top')}
              >
                俯视
              </button>
              <button
                type="button"
                className={`touch-target motional-emf-view-button ${cameraView === 'bottom' ? 'active' : ''}`.trim()}
                onClick={() => setCameraView('bottom')}
              >
                底视
              </button>
            </div>
          </section>
        </>
      }
      playbackActions={clockActions(
        { running: state.running, toggle: state.toggleRunning, step: state.step },
        { stepLabel: '单步 0.1 s', onReset: state.reset },
      )}
      dataOverlay={
        <DataRows
          rows={[
            { label: '运动状态', value: state.running ? '运动中' : state.steppedInMotion ? '运动中（定格）' : state.phase >= 1 ? '行程完成' : state.phase > 0 ? '已暂停' : '静止' },
            { label: '行程', value: <>{(state.phase * 100).toFixed(0)}%</> },
            { label: <>电压 U<sub>AB</sub></>, value: <>{state.signedVoltageV.toFixed(2)} V</>, answer: true },
            { label: '极性', value: state.polarityText, answer: true },
            { label: '∠(B,L) / ∠(L,v) / ∠(B,v)', value: <>{state.angleBetweenBLLabel} / {state.angleBetweenLVLabel} / {state.angleBetweenBVLabel}</> },
          ]}
        />
      }
      viewport={
        <FittedCanvas
          shot={{ from: activeCameraPreset.from, to: activeCameraPreset.to }}
          refitKey={cameraView}
          fov={activeCameraPreset.fov}
          cameraUp={activeCameraPreset.up}
          minDistance={6}
          maxDistance={22}
          frameloop={state.running ? 'always' : 'demand'}
        >
          <MotionalEmfRig3D
            motionOffset={state.motionOffset}
            rodLengthM={state.rodLengthM}
            rodAngleDeg={state.rodAngleDeg}
            discussionMode={state.discussionMode}
            velocityPreset={state.velocityPreset}
            rodVelocityAngleDeg={state.rodVelocityAngleDeg}
            motionDirection={state.motionDirection}
            magneticFieldDirection={state.magneticFieldDirection}
            velocitySpeedMps={state.speedMps}
            currentActive={state.running && Math.abs(state.signedVoltageV) > 1e-9}
            needleAngleRad={state.needleAngleRad}
          />
        </FittedCanvas>
      }
    />
  )
}

export default MotionalEmfScene
