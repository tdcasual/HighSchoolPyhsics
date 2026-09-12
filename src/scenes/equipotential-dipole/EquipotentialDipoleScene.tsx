import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { EquipotentialDipoleControls } from './EquipotentialDipoleControls'
import { EquipotentialDipoleRig3D } from './EquipotentialDipoleRig3D'
import { useEquipotentialDipoleSceneState } from './useEquipotentialDipoleSceneState'
import './equipotential-dipole.css'

export function EquipotentialDipoleScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useEquipotentialDipoleSceneState()
  const r = state.readings
  return <SceneLayout controls={<EquipotentialDipoleControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 0, 14], fov: 40 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 18, maxPolarAngle: Math.PI * 0.92 }} frameloop={state.running ? 'always' : 'demand'}><EquipotentialDipoleRig3D elapsed={state.elapsed} flow={state.flow} showEquipotential={state.showEquipotential} showVectors={state.showVectors} separation={state.separation} charge={state.charge} probeX={state.probeX} probeY={state.probeY} readings={r} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="equipotential-dipole-telemetry"><p><span>坐标位置 (x, y)</span><strong>({state.probeX.toFixed(1)}, {state.probeY.toFixed(1)})</strong></p><p><span>正电荷场强 E₁</span><strong>{r.positiveMagnitude.toFixed(2)} V/m</strong></p><p><span>负电荷场强 E₂</span><strong>{r.negativeMagnitude.toFixed(2)} V/m</strong></p><p><span>合场强 |E|</span><strong>{r.totalMagnitude.toFixed(2)} V/m</strong></p><p><span>该点电势 V</span><strong>{r.potential.toFixed(2)} V</strong></p><p className="equipotential-dipole-conclusion"><span>物理结论</span><strong>{Math.abs(state.probeX) < 0.12 ? '中垂线上 E₁=E₂，电势 V≈0；合场强水平指向负电荷。' : '沿电荷连线移动探针，观察两电场矢量同向叠加与场强变化。'}</strong></p></div>} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停流动' : '继续流动', onClick: state.toggleRunning }, { key: 'reset', label: '重置探针', onClick: state.reset }]} />
}

export default EquipotentialDipoleScene
