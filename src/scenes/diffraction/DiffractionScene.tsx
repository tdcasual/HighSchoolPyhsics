// readyText: 衍射演示控制

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
        <div className="scene-core-summary-stack w-[200px] max-w-full min-w-0" style={{ overflowWrap: 'anywhere' }}>
          <p><span>光源</span><strong>{state.isLightOn ? (state.isWhiteLight ? '白光' : '单色') : '关闭'}</strong></p>
          {!state.isWhiteLight && <p><span>波长</span><strong>{state.params.wavelength} nm</strong></p>}
          {state.isWhiteLight && state.filterColor !== 'none' && (
            <p><span>滤光片</span><strong>{state.filterColor === 'red' ? '红' : state.filterColor === 'green' ? '绿' : '蓝'}</strong></p>
          )}
          <p>{featureLabel}: {featureValue}</p>
          {state.mode === 'diffraction-grating' && (
            <>
              <p><span>光栅常数 d</span><strong>{(gratingSpacing(state.params.gratingLines) * 1e6).toFixed(2)} μm</strong></p>
              <p><span>狭缝宽 a</span><strong>{(gratingSlitWidth(state.params.gratingLines) * 1e6).toFixed(2)} μm</strong></p>
              <p><span>有效照明狭缝数 N</span><strong>{gratingIlluminatedSlitCount(state.params.gratingLines)}</strong></p><p><span>有效照明宽度</span><strong>{GRATING_ILLUMINATED_WIDTH_MM.toFixed(2)} mm</strong></p>
              <p><span>线密度</span><strong>{state.params.gratingLines} 条/mm</strong></p>
            </>
          )}
          <p><span>屏距</span><strong>{formatScreenDistance(state.params.screenDistance)}</strong></p>
        </div>
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
