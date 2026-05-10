import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { WedgeInterferenceChart } from './WedgeInterferenceChart'
import { WedgeInterferenceControls } from './WedgeInterferenceControls'
import { WedgeInterferenceRig3D } from './WedgeInterferenceRig3D'
import { useWedgeInterferenceSceneState } from './useWedgeInterferenceSceneState'
import './wedge-interference.css'

const CAMERA = { position: [0, 18, 30] as const, fov: 45 }
const CAMERA_CONTROLS = {
  target: [0, 3, 0] as const,
  minDistance: 10,
  maxDistance: 60,
  maxPolarAngle: Math.PI / 2 + 0.1,
}

export function WedgeInterferenceScene() {
  const state = useWedgeInterferenceSceneState()

  const playbackActions = useMemo(() => [
    { key: 'toggle-light', label: state.isLightOn ? '关闭光源' : '打开光源', onClick: state.toggleLight },
    { key: 'reset', label: '重置', onClick: state.reset },
  ], [state.isLightOn, state.toggleLight, state.reset])

  const chartParams = useMemo(
    () => ({
      wavelength: state.wavelength,
      wedgeAngle: state.wedgeAngle,
      maxThickness: state.maxThickness,
      mode: state.mode,
      bumpHeight: state.bumpHeight,
      bumpPosition: state.bumpPosition,
    }),
    [state.wavelength, state.wedgeAngle, state.maxThickness, state.mode, state.bumpHeight, state.bumpPosition],
  )

  return (
    <SceneLayout
      controls={<WedgeInterferenceControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>
            <span>波长 λ</span>
            <strong>{Math.round(state.wavelength)} nm</strong>
          </p>
          <p>
            <span>劈尖角 θ</span>
            <strong>{state.wedgeAngle.toFixed(2)}°</strong>
          </p>
          <p>
            <span>条纹间距 l</span>
            <strong>{state.fringeSpacingLabel}</strong>
          </p>
          <p>
            <span>可见条纹数</span>
            <strong>~{state.fringeCount}</strong>
          </p>
          <p>
            <span>下表面</span>
            <strong>{state.mode === 'flat' ? '平整' : '凸起'}</strong>
          </p>
        </div>
      }
      chart={state.showChart ? <WedgeInterferenceChart params={chartParams} isLightOn={state.isLightOn} /> : undefined}
      chartVisible={state.showChart}
      playbackActions={playbackActions}
      viewport={
        <InteractiveCanvas
          camera={CAMERA}
          controls={CAMERA_CONTROLS}
          frameloop={state.isScanning ? 'always' : 'demand'}
          adaptiveFraming={false}
        >
          <WedgeInterferenceRig3D
            params={chartParams}
            isLightOn={state.isLightOn}
            lightColorHex={state.lightColorHex}
            isScanning={state.isScanning}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default WedgeInterferenceScene
