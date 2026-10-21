import { Answer } from '../../ui/notes/Answer'
import { DataRows } from '../../ui/panels/DataRows'
import { useMemo } from 'react'
import { FILTER_HEX, FILTER_LABEL } from './model'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { DoubleSlitChart } from './DoubleSlitChart'
import { DoubleSlitControls } from './DoubleSlitControls'
import { DoubleSlitRig3D } from './DoubleSlitRig3D'
import { useDoubleSlitSceneState } from './useDoubleSlitSceneState'

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
        <DataRows
          rows={[
            { label: '已知 λ · d · L', value: <>{state.isWhiteLight
                ? '白光' + (state.filterColor !== 'none' ? '（' + FILTER_LABEL[state.filterColor] + '滤光片）' : '')
                : state.isBlindMode ? 'λ 未知' : state.wavelength + ' nm'}
              {` · ${state.slitDistance.toFixed(2)} mm · ${state.screenDistance.toFixed(2)} m`}</> },
            { label: '理论条纹间距 Δx', value: state.fringeSpacingLabel, answer: true },
            { label: '测量头读数 a', value: <>{state.wheelReadoutMm.toFixed(3)} mm</> },
            { label: '记录 a₁ / a₂', value: <>{state.firstReadingMm === null ? '—' : state.firstReadingMm.toFixed(3)} / {state.secondReadingMm === null ? '—' : state.secondReadingMm.toFixed(3)} mm</> },
            { label: '测得 Δx → λ', value: state.measurementResult ? (
                <Answer>
                  {`${state.measurementResult.fringeSpacingMm.toFixed(3)} mm → ${state.measurementResult.wavelengthNm.toFixed(1)} nm` +
                    (state.isBlindMode && measurementError !== null ? `（误差 ${measurementError.toFixed(2)}%）` : '')}
                </Answer>
              ) : '等待两次读数' },
          ]}
        />
      }
      notes={
        <>
          <p>测量：Δx = |a₂ − a₁| / (n − 1)，λ = dΔx / L。</p>
          <p>当前装置：单缝宽度 a = {state.slitWidth.toFixed(3)} mm，双缝间距 d = {state.slitDistance.toFixed(2)} mm，缝屏距 L = {state.screenDistance.toFixed(2)} m。</p>
        </>
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
        <FittedCanvas
          shot={{ from: [-10, 14.5, 28], to: [-5.5, 3.5, 0] }}
          fov={45} minDistance={8} maxDistance={55} far={400} maxPolarAngle={Math.PI / 2 + 0.1}
          frameloop="demand"
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
        </FittedCanvas>
      }
    />
  )
}

export default DoubleSlitScene
