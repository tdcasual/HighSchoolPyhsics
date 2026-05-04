import { useMemo, useState } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MotionalEmfControls } from './MotionalEmfControls'
import { MotionalEmfRig3D } from './MotionalEmfRig3D'
import { useMotionalEmfSceneState } from './useMotionalEmfSceneState'
import './motional-emf.css'

type CameraViewPreset = 'default' | 'top' | 'bottom'

const CAMERA_PRESETS: Record<
  CameraViewPreset,
  {
    camera: { position: [number, number, number]; fov: number; up?: [number, number, number] }
    controls: {
      target: [number, number, number]
      minDistance: number
      maxDistance: number
      minPolarAngle: number
      maxPolarAngle: number
    }
  }
> = {
  default: {
    camera: { position: [2.4, 2.55, 10.8], fov: 36 },
    controls: {
      target: [0.25, 0.25, 0.7],
      minDistance: 6,
      maxDistance: 22,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
    },
  },
  top: {
    camera: { position: [0, 10.8, 0.001], up: [0, 0, -1], fov: 32 },
    controls: {
      target: [0, -0.25, -0.35],
      minDistance: 6,
      maxDistance: 22,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
    },
  },
  bottom: {
    camera: { position: [0, -10.8, 0.001], up: [0, 0, 1], fov: 32 },
    controls: {
      target: [0, -0.25, -0.35],
      minDistance: 6,
      maxDistance: 22,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
    },
  },
}

export function MotionalEmfScene() {
  const state = useMotionalEmfSceneState()
  const [cameraView, setCameraView] = useState<CameraViewPreset>('default')
  const activeCameraPreset = useMemo(() => CAMERA_PRESETS[cameraView], [cameraView])

  return (
    <SceneLayout
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
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>电压 U_AB: {state.signedVoltageV.toFixed(2)} V</p>
          <p>极性: {state.polarityText}</p>
          <p>∠(B,L): {state.angleBetweenBLLabel}</p>
          <p>∠(L,v): {state.angleBetweenLVLabel}</p>
          <p>∠(B,v): {state.angleBetweenBVLabel}</p>
          <p>关系: {state.relationText}</p>
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
          key={cameraView}
          camera={activeCameraPreset.camera}
          controls={activeCameraPreset.controls}
          frameloop="always"
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
            currentActive={Math.abs(state.signedVoltageV) > 1e-9}
            needleAngleRad={state.needleAngleRad}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default MotionalEmfScene
