import { Answer } from '../../ui/notes/Answer'
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

  const chartParams = useMemo(
    () => ({
      wavelength: state.wavelength,
      wedgeAngle: state.wedgeAngle,
      mode: state.mode,
      bumpHeight: state.bumpHeight,
      bumpPosition: state.bumpPosition,
    }),
    [state.wavelength, state.wedgeAngle, state.mode, state.bumpHeight, state.bumpPosition],
  )

  return (
    <SceneLayout
      controls={<WedgeInterferenceControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>
            <span>已知 λ · θ</span>
            <strong>{Math.round(state.wavelength)} nm · {(state.wedgeAngle * Math.PI / 180 * 1000).toFixed(3)} mrad</strong>
          </p>
          <p>
            <span>条纹间距 l</span>
            <strong><Answer>{state.fringeSpacingLabel}</Answer></strong>
          </p>
          <p>
            <span>视场最大间隙 hmax</span>
            <strong>{state.maxThickness.toFixed(2)} μm</strong>
          </p>
          {state.mode === 'bump' && (
            <p>
              <span>表面凸起 h</span>
              <strong>{state.bumpHeight.toFixed(1)} μm</strong>
            </p>
          )}
          <p>
            <span>可见条纹数</span>
            <strong><Answer>~{state.fringeCount}</Answer></strong>
          </p>
        </div>
      }
      notes={
        <>
          <p>λ = {Math.round(state.wavelength)} nm，劈尖角 θ = {state.wedgeAngle.toFixed(4)}°（{(state.wedgeAngle * Math.PI / 180 * 1000).toFixed(3)} mrad），下表面{state.mode === 'flat' ? '平整' : '凸起'}；条纹间距 l = λ/(2θ)。</p>
          <p>板间隙与垫片外观为放大示意；条纹按实际 θ、λ 和凸起高度计算。</p>
        </>
      }
      chart={state.showChart ? <WedgeInterferenceChart params={chartParams} isLightOn={state.isLightOn} /> : undefined}
      chartVisible={state.showChart}
      chartInitiallyCollapsed
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
