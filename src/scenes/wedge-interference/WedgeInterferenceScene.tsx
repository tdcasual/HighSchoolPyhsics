import { DataRows } from '../../ui/panels/DataRows'
import { useMemo } from 'react'
import { FittedCanvas } from '../../scene3d/FittedCanvas'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { WedgeInterferenceChart } from './WedgeInterferenceChart'
import { WedgeInterferenceControls } from './WedgeInterferenceControls'
import { WedgeInterferenceRig3D } from './WedgeInterferenceRig3D'
import { useWedgeInterferenceSceneState } from './useWedgeInterferenceSceneState'
import './wedge-interference.css'

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
        <DataRows
          rows={[
            { label: '已知 λ · θ', value: <>{Math.round(state.wavelength)} nm · {(state.wedgeAngle * Math.PI / 180 * 1000).toFixed(3)} mrad</> },
            { label: '条纹间距 l', value: state.fringeSpacingLabel, answer: true },
            { label: '视场最大间隙 hmax', value: <>{state.maxThickness.toFixed(2)} μm</> },
            { label: '表面凸起 h', value: <>{state.bumpHeight.toFixed(1)} μm</>, when: state.mode === 'bump' },
            { label: '可见条纹数', value: <>~{state.fringeCount}</>, answer: true },
          ]}
        />
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
        <FittedCanvas
          shot={{ from: [0, 18, 30], to: [0, 3, 0] }}
          fov={45} minDistance={10} maxDistance={60} maxPolarAngle={Math.PI / 2 + 0.1}
          frameloop={state.isScanning ? 'always' : 'demand'}
        >
          <WedgeInterferenceRig3D
            params={chartParams}
            isLightOn={state.isLightOn}
            lightColorHex={state.lightColorHex}
            isScanning={state.isScanning}
          />
        </FittedCanvas>
      }
    />
  )
}

export default WedgeInterferenceScene
