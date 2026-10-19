import { useMemo } from 'react'
import { FILTER_HEX, FILTER_LABEL } from './model'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { DoubleSlitChart } from './DoubleSlitChart'
import { DoubleSlitControls } from './DoubleSlitControls'
import { DoubleSlitRig3D } from './DoubleSlitRig3D'
import { useDoubleSlitSceneState } from './useDoubleSlitSceneState'
import './double-slit.css'

const CAMERA = { position: [-10, 14.5, 28] as const, fov: 45 }
const CAMERA_CONTROLS = {
  target: [-5.5, 3.5, 0] as const,
  minDistance: 8,
  maxDistance: 55,
  maxPolarAngle: Math.PI / 2 + 0.1,
}

export function DoubleSlitScene() {
  const state = useDoubleSlitSceneState()

  const beamColorHex = useMemo(() => {
    if (!state.isWhiteLight) return state.lightColorHex
    if (state.filterColor === 'none') return 0xffffff
    return FILTER_HEX[state.filterColor]
  }, [state.isWhiteLight, state.filterColor, state.lightColorHex])

  const chartParams = useMemo(
    () => ({
      wavelength: state.wavelength,
      slitDistance: state.slitDistance,
      screenDistance: state.screenDistance,
      slitWidth: state.slitWidth,
    }),
    [state.wavelength, state.slitDistance, state.screenDistance, state.slitWidth],
  )

  const measurementError = state.measurementResult && state.wavelength > 0
    ? Math.abs(state.measurementResult.wavelengthNm - state.wavelength) / state.wavelength * 100
    : null

  return (
    <SceneLayout
      controls={<DoubleSlitControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>
            <span>光源波长 λ</span>
            <strong>
              {state.isWhiteLight
                ? '白光 400–700 nm' + (state.filterColor !== 'none' ? '（' + FILTER_LABEL[state.filterColor] + '滤光片）' : '')
                : state.isBlindMode ? '未知单色光（已隐藏）' : state.wavelength + ' nm'}
            </strong>
          </p>
          <p><span>单缝宽度 a</span><strong>{state.slitWidth.toFixed(3)} mm</strong></p>
          <p><span>双缝间距 d</span><strong>{state.slitDistance.toFixed(2)} mm</strong></p>
          <p><span>缝屏距 L</span><strong>{state.screenDistance.toFixed(2)} m</strong></p>
          <p><span>理论条纹间距 Δx</span><strong>{state.fringeSpacingLabel}</strong></p>
          <p><span>测量头读数 a</span><strong>{state.wheelReadoutMm.toFixed(3)} mm</strong></p>
          <p><span>记录 a₁ / a₂</span><strong>{state.firstReadingMm === null ? '—' : state.firstReadingMm.toFixed(3)} / {state.secondReadingMm === null ? '—' : state.secondReadingMm.toFixed(3)} mm</strong></p>
          <p><span>测量条纹间距</span><strong>{state.measurementResult ? state.measurementResult.fringeSpacingMm.toFixed(3) + ' mm' : '等待两次读数'}</strong></p>
          <p><span>反算波长 λ</span><strong>{state.measurementResult ? state.measurementResult.wavelengthNm.toFixed(1) + ' nm' : '—'}</strong></p>
          {state.measurementResult && state.isBlindMode && measurementError !== null && (
            <p><span>相对误差</span><strong>{measurementError.toFixed(2)}%</strong></p>
          )}
          <p className="summary-note">Δx = |a₂−a₁|/(n−1)，λ = dΔx/L</p>
        </div>
      }
      chart={state.showChart ? (
        <DoubleSlitChart
          params={chartParams}
          isLightOn={state.isLightOn}
          isWhiteLight={state.isWhiteLight}
          filterColor={state.filterColor}
          doubleSlitAngle={state.doubleSlitAngle}
          singleSlitAngle={state.singleSlitAngle}
          eyepieceAngle={state.eyepieceAngle}
          wheelReadoutMm={state.wheelReadoutMm}
          showFringeOrders={state.showFringeOrders}
        />
      ) : undefined}
      chartVisible={state.showChart}
      chartInitiallyCollapsed
      viewport={
        <InteractiveCanvas
          camera={CAMERA}
          controls={CAMERA_CONTROLS}
          frameloop="demand"
          adaptiveFraming={false}
        >
          <DoubleSlitRig3D
            params={chartParams}
            lightColorHex={beamColorHex}
            isLightOn={state.isLightOn}
            isWhiteLight={state.isWhiteLight}
            filterColor={state.filterColor}
            singleSlitAngle={state.singleSlitAngle}
            doubleSlitAngle={state.doubleSlitAngle}
            eyepieceAngle={state.eyepieceAngle}
            wheelReadoutMm={state.wheelReadoutMm}
            showFringeOrders={state.showFringeOrders}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default DoubleSlitScene
