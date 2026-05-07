import { useMemo } from 'react'
import type { FilterColor } from './model'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { DoubleSlitChart } from './DoubleSlitChart'
import { DoubleSlitControls } from './DoubleSlitControls'
import { DoubleSlitRig3D } from './DoubleSlitRig3D'
import { useDoubleSlitSceneState } from './useDoubleSlitSceneState'
import './double-slit.css'

export function DoubleSlitScene() {
  const state = useDoubleSlitSceneState()

  const FILTER_HEX: Record<Exclude<FilterColor, 'none'>, number> = { red: 0xff4444, green: 0x44cc44, blue: 0x4488ff }

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

  return (
    <SceneLayout
      controls={<DoubleSlitControls state={state} />}
      dataOverlay={
        <div className="scene-core-summary-stack">
          <p>
            <span>波长 λ</span>
            <strong>
              {state.isWhiteLight
                ? `白光 400-700nm${state.filterColor !== 'none' ? ` (${state.filterColor === 'red' ? '红' : state.filterColor === 'green' ? '绿' : '蓝'}滤光片)` : ''}`
                : `${Math.round(state.wavelength)} nm`}
            </strong>
          </p>
          <p>
            <span>单缝宽度 a</span>
            <strong>{state.slitWidth.toFixed(3)} mm</strong>
          </p>
          <p>
            <span>双缝间距 d</span>
            <strong>{state.slitDistance.toFixed(2)} mm</strong>
          </p>
          <p>
            <span>缝屏距 L</span>
            <strong>{state.screenDistance.toFixed(2)} m</strong>
          </p>
          <p>
            <span>条纹间距 Δx</span>
            <strong>{state.fringeSpacingLabel}</strong>
          </p>
        </div>
      }
      chart={state.showChart ? <DoubleSlitChart params={chartParams} isLightOn={state.isLightOn} isWhiteLight={state.isWhiteLight} filterColor={state.filterColor} doubleSlitAngle={state.doubleSlitAngle} eyepieceAngle={state.eyepieceAngle} /> : undefined}
      chartVisible={state.showChart}
      playbackActions={[
        { key: 'toggle-light', label: state.isLightOn ? '关闭光源' : '打开光源', onClick: state.toggleLight },
        { key: 'reset', label: '重置', onClick: state.reset },
      ]}
      viewport={
        <InteractiveCanvas
          camera={{ position: [0, 15, 35], fov: 45 }}
          controls={{
            target: [0, 3, 0],
            minDistance: 10,
            maxDistance: 60,
            maxPolarAngle: Math.PI / 2 + 0.1,
          }}
          frameloop="demand"
          adaptiveFraming={false}
        >
          <DoubleSlitRig3D
            screenDistance={state.screenDistance}
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

export default DoubleSlitScene
