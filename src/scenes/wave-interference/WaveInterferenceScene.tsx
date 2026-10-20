import { Answer } from '../../ui/notes/Answer'
import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { WaveInterferenceControls } from './WaveInterferenceControls'
import { WaveInterferenceRig3D } from './WaveInterferenceRig3D'
import { WaveInterferenceChart } from './WaveInterferenceChart'
import { useWaveInterferenceSceneState } from './useWaveInterferenceSceneState'
import {
  calcDistances,
  calcPhaseDiff,
  calcCombinedAmplitude,
  calcCombinedDisplacement,
  getInterferenceStatus,
  hasEqualWavelengths,
  wrapPhase,
  MAX_HISTORY,
  type Vec2,
} from './model'
import './wave-interference.css'

const CAMERA = { position: [0, 6, 6] as const, fov: 50 }
const CAMERA_CONTROLS = {
  target: [0, 0, 0] as const,
  minDistance: 3,
  maxDistance: 20,
  maxPolarAngle: Math.PI / 2,
}

export function WaveInterferenceScene() {
  const state = useWaveInterferenceSceneState()

  const dataOverlay = useMemo(() => {
    if (!state.observer) return null
    const obs: Vec2 = { x: state.observer.x, z: state.observer.z }
    const { r1, r2, dr } = calcDistances(obs, state.source1, state.source2)
    const params = {
      wavelength1: state.wavelength1,
      wavelength2: state.wavelength2,
      amplitude1: state.amplitude1,
      amplitude2: state.amplitude2,
      phaseDiff: state.phaseDiff,
      waveSpeed: state.waveSpeed,
      source1: state.source1,
      source2: state.source2,
    }
    const dphi = calcPhaseDiff(obs, params, state.observer.time)
    const sameFrequency = hasEqualWavelengths(state.wavelength1, state.wavelength2)
    const envelopeAmplitude = calcCombinedAmplitude(params, dphi)
    const instantaneousDisplacement = calcCombinedDisplacement(obs, params, state.observer.time)
    const info = getInterferenceStatus(dr, params, dphi)
    const phaseLabel = info.label

    return (
      <div className="scene-core-summary-stack">
        <p>
          <span>到 S₁ / S₂ 距离</span>
          <strong>{r1.toFixed(3)} m / {r2.toFixed(3)} m</strong>
        </p>
        <p>
          <span>波程差 Δr</span>
          <strong>{dr.toFixed(4)} m</strong>
        </p>
        <p>
          <span>相位差 Δφ</span>
          <strong><Answer>{(wrapPhase(dphi) / Math.PI).toFixed(2)}π rad</Answer></strong>
        </p>
        <p>
          <span>{sameFrequency ? '合振幅（包络）' : '瞬时合位移 y'}</span>
          <strong><Answer>{(sameFrequency ? envelopeAmplitude : instantaneousDisplacement).toFixed(3)} m</Answer></strong>
        </p>
        <p>
          <span>{sameFrequency ? '干涉关系' : '当前相位关系'}</span>
          <strong><Answer>{phaseLabel}{sameFrequency ? '' : '（频率不同，无固定干涉线）'}</Answer></strong>
        </p>
      </div>
    )
  }, [state.observer, state.source1, state.source2, state.wavelength1, state.wavelength2,
      state.amplitude1, state.amplitude2, state.phaseDiff, state.waveSpeed])

  const maxAmp = state.amplitude1 + state.amplitude2

  return (
    <SceneLayout
      controls={<WaveInterferenceControls state={state} />}
      dataOverlay={dataOverlay}
      playbackActions={[
        { key: 'play', label: state.isPlaying ? '暂停' : '播放', onClick: state.togglePlay },
        { key: 'step', label: '单步 T/4', onClick: state.step },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      chart={state.showChart ? (
        <WaveInterferenceChart
          observer={state.observer}
          maxAmp={maxAmp}
          maxHistory={MAX_HISTORY}
        />
      ) : undefined}
      chartVisible={state.showChart}
      chartInitiallyCollapsed
      viewport={
        <InteractiveCanvas
          camera={CAMERA}
          controls={CAMERA_CONTROLS}
          frameloop={state.isPlaying ? 'always' : 'demand'}
        >
          <WaveInterferenceRig3D
            source1={state.source1}
            source2={state.source2}
            wavelength1={state.wavelength1}
            wavelength2={state.wavelength2}
            amplitude1={state.amplitude1}
            amplitude2={state.amplitude2}
            phaseDiff={state.phaseDiff}
            waveSpeed={state.waveSpeed}
            isPlaying={state.isPlaying}
            playSpeed={state.playSpeed}
            resetVersion={state.resetVersion}
            stepVersion={state.stepVersion}
            stepS={state.stepS}
            observerBuffer={state.observerBuffer}
            setSource1={state.setSource1}
            setSource2={state.setSource2}
            setObserverBuffer={state.setObserverBuffer}
            showConstructive={state.showConstructive}
            showDestructive={state.showDestructive}
            _tickSyncRef={state._tickSyncRef}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default WaveInterferenceScene
