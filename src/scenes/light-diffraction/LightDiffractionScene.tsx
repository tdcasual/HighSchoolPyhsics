import { DataRows } from '../../ui/panels/DataRows'
import { useMemo } from 'react'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { FILTER_HEX, FILTER_LABEL, GRATING_ILLUMINATED_WIDTH_MM, MODE_LABEL, formatScreenDistance, formatWhiteLightFeatureValue, gratingIlluminatedSlitCount, gratingSlitWidth, gratingSpacing } from './model'
import { LightDiffractionChart } from './LightDiffractionChart'
import { LightDiffractionControls } from './LightDiffractionControls'
import { LightDiffractionRig3D } from './LightDiffractionRig3D'
import { useLightDiffractionSceneState } from './useLightDiffractionSceneState'
import './light-diffraction.css'

/** Looking along the bench from the screen end; FittedCanvas sets the distance from the apparatus. */
const BENCH_SHOT = { azimuth: Math.atan2(0.9, 0.35), elevation: Math.atan2(0.25, Math.hypot(0.9, 0.35)) }

export function LightDiffractionScene() {
  const state = useLightDiffractionSceneState()

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
        <DataRows
          className="w-[260px] max-w-full min-w-0"
          rows={[
            { label: '模式', value: MODE_LABEL[state.mode] },
            { label: '波长 λ', value: state.isWhiteLight
                ? `白光 400-700nm${state.filterColor !== 'none' ? ` (${FILTER_LABEL[state.filterColor]}滤光片)` : ''}`
                : `${Math.round(state.wavelength)} nm` },
            { label: '光栅常数 d', value: <>{(gratingSpacing(state.gratingLines) * 1e6).toFixed(2)} μm（{state.gratingLines.toFixed(0)} 线/mm）</>, when: state.mode === 'diffraction-grating' },
            { label: state.mode === 'single-slit' ? '缝宽 a' : '孔径 D', value: <>{state.apertureSize.toFixed(3)} mm</>, when: !(state.mode === 'diffraction-grating') },
            { label: '缝屏距 L', value: formatScreenDistance(state.screenDistance) },
            { label: state.featureLabel, value: state.isWhiteLight ? formatWhiteLightFeatureValue(chartParams, state.mode, state.filterColor) : state.featureValue, answer: true },
          ]}
        />
      }
      notes={
        <>
          {state.mode === 'diffraction-grating' && (
            <p>
              光栅模型：狭缝宽 a = {(gratingSlitWidth(state.gratingLines) * 1e6).toFixed(2)} μm；有效照明宽度 {GRATING_ILLUMINATED_WIDTH_MM.toFixed(2)} mm（N = {gratingIlluminatedSlitCount(state.gratingLines)}）。
            </p>
          )}
          {state.mode === 'circular-obstacle' && <p>近轴菲涅耳 / 巴比涅模型显示轴上亮斑；外圈采用理想圆盘近似。</p>}
          <p>3D 开口、光路与屏幕尺寸为示意；屏上颜色/亮度经过增强，定量以分析图表坐标为准。</p>
        </>
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
      chartInitiallyCollapsed={false}
      viewport={
        <FittedCanvas
          shot={BENCH_SHOT}
          refitKey={String(state.screenDistance)}
          fov={32}
          minDistance={10}
          maxDistance={90}
          far={400}
          maxPolarAngle={Math.PI / 2 + 0.1}
          frameloop="demand"
        >
          <LightDiffractionRig3D
            params={chartParams}
            mode={state.mode}
            lightColorHex={beamColorHex}
            isLightOn={state.isLightOn}
            isWhiteLight={state.isWhiteLight}
            filterColor={state.filterColor}
          />
        </FittedCanvas>
      }
    />
  )
}

export default LightDiffractionScene
