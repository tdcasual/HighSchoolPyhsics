import { DataRows } from '../../ui/panels/DataRows'
import { clockActions } from '../../simulation/clockActions'
import { useMemo } from 'react'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
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
      <DataRows
        rows={[
          {
            label: '到 S₁ / S₂ 距离',
            value: (
              <>
                {r1.toFixed(3)} m / {r2.toFixed(3)} m
              </>
            ),
          },
          { label: '波程差 Δr', value: <>{dr.toFixed(4)} m</> },
          { label: '相位差 Δφ', value: <>{(wrapPhase(dphi) / Math.PI).toFixed(2)}π rad</>, answer: true },
          {
            label: sameFrequency ? '合振幅（包络）' : '瞬时合位移 y',
            value: <>{(sameFrequency ? envelopeAmplitude : instantaneousDisplacement).toFixed(3)} m</>,
            answer: true,
          },
          {
            label: sameFrequency ? '干涉关系' : '当前相位关系',
            value: (
              <>
                {phaseLabel}
                {sameFrequency ? '' : '（频率不同，无固定干涉线）'}
              </>
            ),
            answer: true,
          },
        ]}
      />
    )
  }, [
    state.observer,
    state.source1,
    state.source2,
    state.wavelength1,
    state.wavelength2,
    state.amplitude1,
    state.amplitude2,
    state.phaseDiff,
    state.waveSpeed,
  ])

  const maxAmp = state.amplitude1 + state.amplitude2

  return (
    <SceneLayout
      controls={<WaveInterferenceControls state={state} />}
      dataOverlay={dataOverlay}
      playbackActions={clockActions(
        { running: state.isPlaying, toggle: state.togglePlay, step: state.step },
        { stepLabel: '单步 T/4', onReset: state.reset },
      )}
      chart={
        state.showChart ? (
          <WaveInterferenceChart observer={state.observer} maxAmp={maxAmp} maxHistory={MAX_HISTORY} />
        ) : undefined
      }
      chartVisible={state.showChart}
      chartInitiallyCollapsed
      viewport={
        <FittedCanvas
          shot={{ from: [0, 6, 6], to: [0, 0, 0] }}
          fov={50}
          minDistance={3}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2}
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
            time={state.time}
            frameVersion={state.frameVersion}
            resetVersion={state.resetVersion}
            observerBuffer={state.observerBuffer}
            setSource1={state.setSource1}
            setSource2={state.setSource2}
            setObserverBuffer={state.setObserverBuffer}
            showConstructive={state.showConstructive}
            showDestructive={state.showDestructive}
            _tickSyncRef={state._tickSyncRef}
          />
        </FittedCanvas>
      }
    />
  )
}

export default WaveInterferenceScene
