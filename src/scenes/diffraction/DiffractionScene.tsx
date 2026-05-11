// readyText: 衍射演示控制

import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { DiffractionControls } from './DiffractionControls'
import { DiffractionRig3D } from './DiffractionRig3D'
import { DiffractionProfile } from './DiffractionProfile'
import { useDiffractionSceneState } from './useDiffractionSceneState'
import {
  formatFeatureLabel,
  formatFeatureValue,
  formatWhiteLightFeatureValue,
} from '../light-diffraction/model'

const CAMERA = {
  position: [0.35, 0.3, 0.45] as [number, number, number],
  fov: 50,
}

const CAMERA_CONTROLS = {
  target: [0, 0, 0.15] as [number, number, number],
  minDistance: 0.15,
  maxDistance: 3,
  enablePan: true,
}

export function DiffractionScene() {
  const state = useDiffractionSceneState()

  const playbackActions = useMemo(() => [
    { key: 'toggle-light', label: state.isLightOn ? '关闭光源' : '打开光源', onClick: state.toggleLight },
    { key: 'reset', label: '重置', onClick: state.reset },
  ], [state.isLightOn, state.toggleLight, state.reset])

  const screenWidthM = 1.2
  const screenHeightM = 0.9

  const featureLabel = useMemo(() => formatFeatureLabel(state.mode), [state.mode])
  const featureValue = useMemo(() => {
    if (state.isWhiteLight) {
      return formatWhiteLightFeatureValue(state.params, state.mode)
    }
    return formatFeatureValue(state.params, state.mode)
  }, [state.params, state.mode, state.isWhiteLight])

  return (
    <SceneLayout
      controls={<DiffractionControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>光源: {state.isLightOn ? (state.isWhiteLight ? '白光' : '单色') : '关闭'}</p>
          {!state.isWhiteLight && <p>波长: {state.params.wavelength} nm</p>}
          {state.isWhiteLight && state.filterColor !== 'none' && (
            <p>滤光片: {state.filterColor === 'red' ? '红' : state.filterColor === 'green' ? '绿' : '蓝'}</p>
          )}
          <p>{featureLabel}: {featureValue}</p>
          <p>屏距: {state.params.screenDistance.toFixed(1)} m</p>
        </div>
      }
      chart={state.showChart ? (
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
      chartVisible={state.showChart}
      playbackActions={playbackActions}
      viewport={
        <InteractiveCanvas camera={CAMERA} controls={CAMERA_CONTROLS} frameloop="demand" adaptiveFraming={false}>
          <DiffractionRig3D
            mode={state.mode}
            params={state.params}
            isLightOn={state.isLightOn}
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
