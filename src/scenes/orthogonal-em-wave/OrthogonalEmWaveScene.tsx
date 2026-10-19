import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { useMediaQuery } from '../../ui/hooks/useMediaQuery'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { OrthogonalEmWaveChart } from './OrthogonalEmWaveChart'
import { OrthogonalEmWaveControls } from './OrthogonalEmWaveControls'
import { OrthogonalEmWaveRig3D } from './OrthogonalEmWaveRig3D'
import { useOrthogonalEmWaveSceneState } from './useOrthogonalEmWaveSceneState'
import { wrapPhase } from './model'
import './orthogonal-em-wave.css'

export function OrthogonalEmWaveScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useOrthogonalEmWaveSceneState()
  const isCompactDesktop = useMediaQuery('(min-width: 768px) and (max-width: 1100px)')
  const r = state.readings
  const directionLabel = state.direction === 'right' ? '向右' : '向左'
  const cameraByView = {
    '3d': [9, 7, 14],
    xy: [0, 0, 15],
    xz: [0, 15, 0],
    yz: [14, 0, 0],
  } as const
  const cameraPosition = cameraByView[state.viewMode]
  const cameraUp: [number, number, number] = state.viewMode === 'xz' ? [0, 0, -1] : [0, 1, 0]
  return <SceneLayout panelPlacement={isCompactDesktop ? 'after-sidebar' : 'default'} auxiliaryPanelPlacement={isCompactDesktop ? 'default' : 'after-sidebar'} controls={<OrthogonalEmWaveControls state={state} />} viewport={<InteractiveCanvas camera={{ position: cameraPosition, fov: 42 }} cameraUp={cameraUp} syncCamera controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 22, maxPolarAngle: Math.PI * 0.9 }} frameloop={state.running ? 'always' : 'demand'}><OrthogonalEmWaveRig3D {...state} theme={theme} compactDesktop={isCompactDesktop} /></InteractiveCanvas>} dataOverlay={<div className="orthogonal-em-wave-telemetry scene-core-summary-stack"><p><span>传播方向</span><strong>{directionLabel}（x 轴）</strong></p><p><span>仿真频率 fₛᵢₘ=vₛᵢₘ/λ</span><strong>{r.frequency.toFixed(2)} Hz</strong></p><p><span>波数 k=2π/λ</span><strong>{r.waveNumber.toFixed(2)} rad/m</strong></p><p><span>探针相位 φ（模 2π）</span><strong>{(wrapPhase(r.phase) / Math.PI).toFixed(2)}π</strong></p><p><span>探针 E、B</span><strong data-testid="orthogonal-em-wave-fields">{r.probe.e.toFixed(2)} / {r.probe.b.toFixed(2)} a.u.</strong></p><p className="orthogonal-em-wave-conclusion"><span>空间关系</span><strong>E ⟂ B，且 E×B 指向传播方向；左行时 B 分量反号。场强按峰值归一化（a.u.），调速用于教学演示；真空电磁波满足 v=c、E₀=cB₀。</strong></p></div>} chart={<OrthogonalEmWaveChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停传播' : state.elapsed === 0 ? '开始传播' : '继续传播', onClick: state.toggleRunning }, { key: 'reset', label: '重置相位', onClick: state.reset }]} chartVisible chartInitiallyCollapsed playbackInitiallyCollapsed />
}

export default OrthogonalEmWaveScene
