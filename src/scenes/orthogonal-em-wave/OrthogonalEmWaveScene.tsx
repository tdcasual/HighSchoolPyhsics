import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { OrthogonalEmWaveChart } from './OrthogonalEmWaveChart'
import { OrthogonalEmWaveControls } from './OrthogonalEmWaveControls'
import { OrthogonalEmWaveRig3D } from './OrthogonalEmWaveRig3D'
import { useOrthogonalEmWaveSceneState } from './useOrthogonalEmWaveSceneState'
import './orthogonal-em-wave.css'

export function OrthogonalEmWaveScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useOrthogonalEmWaveSceneState()
  const r = state.readings
  const directionLabel = state.direction === 'right' ? '向右' : '向左'
  return <SceneLayout controls={<OrthogonalEmWaveControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [9, 7, 14], fov: 42 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 22, maxPolarAngle: Math.PI * 0.9 }} frameloop={state.running ? 'always' : 'demand'}><OrthogonalEmWaveRig3D {...state} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="orthogonal-em-wave-telemetry"><p><span>传播方向</span><strong>{directionLabel}（x 轴）</strong></p><p><span>频率 f=v/λ</span><strong>{r.frequency.toFixed(2)} Hz</strong></p><p><span>波数 k=2π/λ</span><strong>{r.waveNumber.toFixed(2)} rad/m</strong></p><p><span>探针相位</span><strong>{(r.phase / Math.PI).toFixed(2)}π</strong></p><p><span>探针 E、B</span><strong>{r.probe.e.toFixed(2)} / {r.probe.b.toFixed(2)} a.u.</strong></p><p className="orthogonal-em-wave-conclusion"><span>空间关系</span><strong>E ⟂ B，且 E、B 均垂直于传播方向 v；在二维投影中用 ⊙ / ⊗ 表示出屏幕方向。</strong></p></div>} chart={<OrthogonalEmWaveChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停传播' : '继续传播', onClick: state.toggleRunning }, { key: 'reset', label: '重置相位', onClick: state.reset }]} chartVisible />
}

export default OrthogonalEmWaveScene
