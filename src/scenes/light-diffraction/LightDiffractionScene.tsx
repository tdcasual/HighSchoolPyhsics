import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { FILTER_HEX, FILTER_LABEL, MODE_LABEL, formatWhiteLightFeatureValue } from './model'
import { LightDiffractionChart } from './LightDiffractionChart'
import { LightDiffractionControls } from './LightDiffractionControls'
import { LightDiffractionRig3D } from './LightDiffractionRig3D'
import { useLightDiffractionSceneState } from './useLightDiffractionSceneState'
import './light-diffraction.css'

const CAMERA = { position: [0, 15, 35] as const, fov: 45 }
const CAMERA_CONTROLS = {
  target: [0, 3, 0] as const,
  minDistance: 10,
  maxDistance: 60,
  maxPolarAngle: Math.PI / 2 + 0.1,
}

export function LightDiffractionScene() {
  const state = useLightDiffractionSceneState()

  const playbackActions = useMemo(
    () => [
      { key: 'toggle-light', label: state.isLightOn ? '关闭光源' : '打开光源', onClick: state.toggleLight },

      { key: 'reset', label: '重置', onClick: state.reset },
    ],
    [state.isLightOn, state.toggleLight, state.reset],
  )

  const beamColorHex = useMemo(() => {
    if (!state.isWhiteLight) return state.lightColorHex
    if (state.filterColor === 'none') return 0xffffff
    return FILTER_HEX[state.filterColor]
  }, [state.isWhiteLight, state.filterColor, state.lightColorHex])

  const chartParams = useMemo(
    () => ({
      wavelength: state.wavelength,
      apertureSize: state.apertureSize,
      screenDistance: state.screenDistance,
      gratingLines: state.gratingLines,
    }),
    [state.wavelength, state.apertureSize, state.screenDistance, state.gratingLines],
  )

  return (
    <SceneLayout
      controls={<LightDiffractionControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>
            <span>模式</span>
            <strong>{MODE_LABEL[state.mode]}</strong>
          </p>
          <p>
            <span>波长 λ</span>
            <strong>
              {state.isWhiteLight
                ? `白光 400-700nm${state.filterColor !== 'none' ? ` (${FILTER_LABEL[state.filterColor]}滤光片)` : ''}`
                : `${Math.round(state.wavelength)} nm`}
            </strong>
          </p>
          <p>
            <span>{state.mode === 'diffraction-grating' ? '光栅缝宽' : state.mode === 'single-slit' ? '缝宽 a' : '孔径 D'}</span>
            <strong>{state.apertureSize.toFixed(3)} mm</strong>
          </p>
          <p>
            <span>缝屏距 L</span>
            <strong>{state.screenDistance.toFixed(2)} m</strong>
          </p>
          <p>
            <span>{state.featureLabel}</span>
            <strong>{state.isWhiteLight ? formatWhiteLightFeatureValue(chartParams, state.mode) : state.featureValue}</strong>
          </p>
        </div>
      }
      chart={
        state.showChart ? (
          <LightDiffractionChart
            params={chartParams}
            mode={state.mode}
            isLightOn={state.isLightOn}
            isWhiteLight={state.isWhiteLight}
            filterColor={state.filterColor}
            eyepieceAngle={state.eyepieceAngle}
          />
        ) : undefined
      }
      chartVisible={state.showChart}
      playbackActions={playbackActions}
      viewport={
        <InteractiveCanvas
          camera={CAMERA}
          controls={CAMERA_CONTROLS}
          frameloop="demand"
          adaptiveFraming={false}
        >
          <LightDiffractionRig3D
            params={chartParams}
            mode={state.mode}
            lightColorHex={beamColorHex}
            isLightOn={state.isLightOn}
            isWhiteLight={state.isWhiteLight}
            filterColor={state.filterColor}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default LightDiffractionScene
