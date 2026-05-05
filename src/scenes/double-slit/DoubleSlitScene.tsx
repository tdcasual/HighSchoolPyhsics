import { useMemo } from 'react'
import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { DoubleSlitChart } from './DoubleSlitChart'
import { DoubleSlitControls } from './DoubleSlitControls'
import { DoubleSlitRig3D } from './DoubleSlitRig3D'
import { useDoubleSlitSceneState } from './useDoubleSlitSceneState'
import './double-slit.css'

export function DoubleSlitScene() {
  const state = useDoubleSlitSceneState()

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
            <strong>{Math.round(state.wavelength)} nm</strong>
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
      chart={state.showChart ? <DoubleSlitChart params={chartParams} isLightOn={state.isLightOn} /> : undefined}
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
            lightColorHex={state.lightColorHex}
            isLightOn={state.isLightOn}
          />
        </InteractiveCanvas>
      }
    />
  )
}

export default DoubleSlitScene
