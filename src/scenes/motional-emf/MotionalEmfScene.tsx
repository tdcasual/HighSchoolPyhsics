import { Answer } from '../../ui/notes/Answer'
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
    camera: { position: [3.65, 2.55, 10.8], fov: 38 },
    controls: {
      target: [1.5, 0.25, 0.7],
      minDistance: 6,
      maxDistance: 22,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
    },
  },
  top: {
    camera: { position: [2, 14.75, -0.999], up: [0, 0, -1], fov: 40 },
    controls: {
      target: [2, -0.25, -1],
      minDistance: 6,
      maxDistance: 22,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
    },
  },
  bottom: {
    camera: { position: [2, -15.25, -0.999], up: [0, 0, 1], fov: 40 },
    controls: {
      target: [2, -0.25, -1],
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
      playbackActions={[
        { key: 'toggle-running', label: state.running ? '暂停' : '播放', onClick: state.toggleRunning },
        { key: 'step', label: '单步 0.1 s', onClick: state.step },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p><span>运动状态</span><strong>{state.running ? '运动中' : state.steppedInMotion ? '运动中（定格）' : state.phase >= 1 ? '行程完成' : state.phase > 0 ? '已暂停' : '静止'}</strong></p>
          <p><span>行程</span><strong>{(state.phase * 100).toFixed(0)}%</strong></p>
          <p><span>电压 U<sub>AB</sub></span><strong><Answer>{state.signedVoltageV.toFixed(2)} V</Answer></strong></p>
          <p><span>极性</span><strong><Answer>{state.polarityText}</Answer></strong></p>
          <p><span>∠(B,L) / ∠(L,v) / ∠(B,v)</span><strong>{state.angleBetweenBLLabel} / {state.angleBetweenLVLabel} / {state.angleBetweenBVLabel}</strong></p>
        </div>
      }
      viewport={
        <InteractiveCanvas
          camera={activeCameraPreset.camera}
          controls={activeCameraPreset.controls}
          syncCamera
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
        </InteractiveCanvas>
      }
    />
  )
}

export default MotionalEmfScene
