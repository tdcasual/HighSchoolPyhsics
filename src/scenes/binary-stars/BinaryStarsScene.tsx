import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { BinaryStarsChart } from './BinaryStarsChart'
import { BinaryStarsControls } from './BinaryStarsControls'
import { BinaryStarsRig3D } from './BinaryStarsRig3D'
import { useBinaryStarsSceneState } from './useBinaryStarsSceneState'
import './binary-stars.css'

export function BinaryStarsScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useBinaryStarsSceneState()
  const r = state.readings
  return <SceneLayout controls={<BinaryStarsControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 0, 14], fov: 40 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 18, maxPolarAngle: Math.PI * 0.92 }} frameloop={state.running ? 'always' : 'demand'}><BinaryStarsRig3D elapsed={state.elapsed} mass1={state.mass1} mass2={state.mass2} separation={state.separation} readings={r} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="binary-stars-telemetry"><p><span>星球 1 轨道半径 r₁</span><strong>{r.radius1.toFixed(1)} R</strong></p><p><span>星球 2 轨道半径 r₂</span><strong>{r.radius2.toFixed(1)} R</strong></p><p><span>半径质量反比</span><strong>r₁ : r₂ = 1 : {(r.radius2 / Math.max(0.001, r.radius1)).toFixed(2)}</strong></p><p><span>共同角速度 ω</span><strong>{r.omega.toFixed(3)} rad·s⁻¹</strong></p><p><span>万有引力 F</span><strong>{r.force.toFixed(2)} N</strong></p><p className="binary-stars-conclusion"><span>核心规律</span><strong>m₁r₁ = m₂r₂ = {(state.mass1 * r.radius1).toFixed(1)}；两星同轴、同周期绕质心运动。</strong></p></div>} chart={<BinaryStarsChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停运动' : '继续运动', onClick: state.toggleRunning }, { key: 'reset', label: '重置参数', onClick: state.reset }]} chartVisible />
}

export default BinaryStarsScene
