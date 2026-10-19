import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { EquipotentialDipoleControls } from './EquipotentialDipoleControls'
import { EquipotentialDipoleRig3D } from './EquipotentialDipoleRig3D'
import { useEquipotentialDipoleSceneState } from './useEquipotentialDipoleSceneState'
import './equipotential-dipole.css'

function formatFieldStrength(value: number): string {
  if (value >= 100000) {
    const exponent = Math.floor(Math.log10(value))
    const superscript = String(exponent).split('').map((digit) => ({ '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' }[digit] ?? digit)).join('')
    return (value / 10 ** exponent).toFixed(2) + '×10' + superscript
  }
  return value.toFixed(2)
}

export function EquipotentialDipoleScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useEquipotentialDipoleSceneState()
  const r = state.readings
  const motion = Math.abs(state.probeX) < 0.12
    ? '中垂线上 E₁=E₂，V=0；合场强指向负电荷。'
    : Math.abs(state.probeY) < 0.12 && Math.abs(state.probeX) < state.separation / 2
      ? '两电荷之间 E₁、E₂ 同向，合场强相加。'
      : Math.abs(state.probeY) < 0.12
        ? '两电荷外侧 E₁、E₂ 反向，合场强相减。'
        : '斜向位置应分解两个场强矢量，等势线与合场强正交。'
  return <SceneLayout
    controls={<EquipotentialDipoleControls state={state} />}
    viewport={<InteractiveCanvas camera={{ position: [0, 0, 14], fov: 40 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 18, maxPolarAngle: Math.PI * 0.92 }} frameloop={state.running ? 'always' : 'demand'}><EquipotentialDipoleRig3D elapsed={state.elapsed} flow={state.flow} showEquipotential={state.showEquipotential} showVectors={state.showVectors} separation={state.separation} charge={state.charge} probeX={state.probeX} probeY={state.probeY} readings={r} theme={theme} /></InteractiveCanvas>}
    dataOverlay={<div className="equipotential-dipole-telemetry scene-core-summary-stack">
      <p><span>坐标位置 (x, y)</span><strong>({state.probeX.toFixed(1)}, {state.probeY.toFixed(1)}) cm</strong></p>
      <p><span>正电荷场强 E₁</span><strong>{formatFieldStrength(r.positiveMagnitude)} N/C</strong></p>
      <p><span>负电荷场强 E₂</span><strong>{formatFieldStrength(r.negativeMagnitude)} N/C</strong></p>
      <p><span>合场强 |E|</span><strong>{formatFieldStrength(r.totalMagnitude)} N/C</strong></p>
      <p><span>该点电势 V</span><strong>{(r.potential / 1000).toFixed(2)} kV</strong></p>
    </div>}
    notes={<p>{motion}</p>}
    playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停流动' : '继续流动', onClick: state.toggleRunning }, { key: 'reset', label: '重置探针', onClick: state.reset }]}
  />
}

export default EquipotentialDipoleScene
