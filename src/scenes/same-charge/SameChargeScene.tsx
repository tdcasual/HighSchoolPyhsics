import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { SameChargeChart } from './SameChargeChart'
import { SameChargeControls } from './SameChargeControls'
import { SameChargeRig3D } from './SameChargeRig3D'
import { useSameChargeSceneState } from './useSameChargeSceneState'
import './same-charge.css'

export function SameChargeScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useSameChargeSceneState()
  const r = state.readings
  return <SceneLayout controls={<SameChargeControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 0, 14], fov: 40 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 18, maxPolarAngle: Math.PI * 0.92 }} frameloop={state.running ? 'always' : 'demand'}><SameChargeRig3D elapsed={state.elapsed} separation={state.separation} charge={state.charge} probeX={state.probeX} probeY={state.probeY} polarity={state.polarity} flow={state.flow} showEquipotential={state.showEquipotential} showVectors={state.showVectors} readings={r} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="same-charge-telemetry"><p><span>探针坐标 (x, y)</span><strong>({state.probeX.toFixed(1)}, {state.probeY.toFixed(1)})</strong></p><p><span>单源场强 E₁</span><strong>{r.field1Magnitude.toFixed(2)} N/C</strong></p><p><span>单源场强 E₂</span><strong>{r.field2Magnitude.toFixed(2)} N/C</strong></p><p><span>合场强 |E|</span><strong>{r.totalMagnitude.toFixed(2)} N/C</strong></p><p><span>空间电势 φ</span><strong>{r.potential.toFixed(1)} V</strong></p><p className="same-charge-conclusion"><span>对称性结论</span><strong>{Math.abs(state.probeX) < 0.12 ? '中垂线 x=0：水平方向场强抵消，合场强沿 y 轴；同种电荷电势叠加。' : '改变电荷间距，观察两源场强的空间叠加与等势面拓扑变化。'}</strong></p></div>} chart={<SameChargeChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停流动' : '继续流动', onClick: state.toggleRunning }, { key: 'reset', label: '重置探针', onClick: state.reset }]} chartVisible />
}

export default SameChargeScene
