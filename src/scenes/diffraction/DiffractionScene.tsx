import { DataRows } from '../../ui/panels/DataRows'
import { useMemo } from 'react'
import { useMediaQuery } from '../../ui/hooks/useMediaQuery'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { DiffractionControls } from './DiffractionControls'
import { DiffractionRig3D } from './DiffractionRig3D'
import { DiffractionProfile } from './DiffractionProfile'
import { useDiffractionSceneState } from './useDiffractionSceneState'
import {
  formatFeatureLabel,
  formatScreenDistance,
  gratingSlitWidth,
  gratingSpacing,
  gratingIlluminatedSlitCount,
  GRATING_ILLUMINATED_WIDTH_MM,
  formatFeatureValue,
  formatWhiteLightFeatureValue,
} from '../light-diffraction/model'


export function DiffractionScene() {
  const state = useDiffractionSceneState()
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')

  const screenWidthM = 1.2
  const screenHeightM = 0.9
  const cameraTargetZ = (state.params.screenDistance - 0.2) / 2
  const cameraTargetX = isTablet ? 1.0 : 0
  const cameraDistanceScale = isTablet ? 1.55 : 1
  const camera = useMemo(
    () => ({
      position: [
        cameraTargetX + 1.6 * cameraDistanceScale,
        0.8 * cameraDistanceScale,
        cameraTargetZ - 1.35 * cameraDistanceScale,
      ] as [number, number, number],
      fov: 50,
    }),
    [cameraTargetX, cameraDistanceScale, cameraTargetZ],
  )
  const cameraControls = useMemo(
    () => ({
      target: [cameraTargetX, 0, cameraTargetZ] as [number, number, number],
      minDistance: 0.35,
      maxDistance: 6,
      enablePan: true,
    }),
    [cameraTargetX, cameraTargetZ],
  )

  const featureLabel = useMemo(() => formatFeatureLabel(state.mode), [state.mode])
  const featureValue = useMemo(() => {
    if (state.isWhiteLight) {
      return formatWhiteLightFeatureValue(state.params, state.mode, state.filterColor)
    }
    return formatFeatureValue(state.params, state.mode)
  }, [state.params, state.mode, state.isWhiteLight, state.filterColor])

  return (
    <SceneLayout
      controls={<DiffractionControls state={state} />}
      dataOverlay={
        <DataRows
          className="w-[200px] max-w-full min-w-0"
          rows={[
            { label: '光源', value: !state.isLightOn ? '关闭' : state.isWhiteLight
                ? '白光' + (state.filterColor !== 'none' ? `（${state.filterColor === 'red' ? '红' : state.filterColor === 'green' ? '绿' : '蓝'}滤光片）` : '')
                : `${state.params.wavelength} nm` },
            { label: '光栅常数 d', value: <>{(gratingSpacing(state.params.gratingLines) * 1e6).toFixed(2)} μm（{state.params.gratingLines} 条/mm）</>, when: state.mode === 'diffraction-grating' },
            { label: state.mode === 'single-slit' ? '缝宽 a' : state.mode === 'circular-aperture' ? '孔径 D' : '障碍物直径', value: <>{state.params.apertureSize.toFixed(3)} mm</>, when: !(state.mode === 'diffraction-grating') },
            { label: '屏距 L', value: formatScreenDistance(state.params.screenDistance) },
            { label: featureLabel, value: featureValue, answer: true },
          ]}
        />
      }
      notes={
        state.mode === 'diffraction-grating' ? (
          <p>
            光栅模型：狭缝宽 a = {(gratingSlitWidth(state.params.gratingLines) * 1e6).toFixed(2)} μm；有效照明宽度 {GRATING_ILLUMINATED_WIDTH_MM.toFixed(2)} mm，照明狭缝数 N = {gratingIlluminatedSlitCount(state.params.gratingLines)}。
          </p>
        ) : undefined
      }
      chart={state.showProfile ? (
        <div className="flex flex-col gap-2" style={{ width: 360 }}>
          <DiffractionProfile
            mode={state.mode}
            params={state.params}
            isLightOn={state.isLightOn}
            isWhiteLight={state.isWhiteLight}
            filterColor={state.filterColor}
            width={340}
            height={160}
          />
        </div>
      ) : undefined}
      chartVisible={state.showProfile}
      chartInitiallyCollapsed={false}
      viewport={
        <InteractiveCanvas camera={camera} controls={cameraControls} frameloop="demand" adaptiveFraming={false}>
          <DiffractionRig3D
            mode={state.mode}
            params={state.params}
            isLightOn={state.isLightOn}
            showPattern={state.showPattern}
            isWhiteLight={state.isWhiteLight}
            filterColor={state.filterColor}
            lightColorHex={state.lightColorHex}
            screenWidthM={screenWidthM}
            screenHeightM={screenHeightM}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default DiffractionScene
