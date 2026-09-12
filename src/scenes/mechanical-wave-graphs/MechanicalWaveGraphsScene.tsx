import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { MechanicalWaveGraphsChart } from './MechanicalWaveGraphsChart'
import { MechanicalWaveGraphsControls } from './MechanicalWaveGraphsControls'
import { MechanicalWaveGraphsRig3D } from './MechanicalWaveGraphsRig3D'
import { useMechanicalWaveGraphsSceneState } from './useMechanicalWaveGraphsSceneState'
import './mechanical-wave-graphs.css'

export function MechanicalWaveGraphsScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useMechanicalWaveGraphsSceneState()
  const r = state.readings
  return <SceneLayout controls={<MechanicalWaveGraphsControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 0, 15], fov: 42 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 22, maxPolarAngle: Math.PI * 0.9 }} frameloop={state.running ? 'always' : 'demand'}><MechanicalWaveGraphsRig3D {...state} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="mechanical-wave-graphs-telemetry"><p><span>波速 v=λ/T</span><strong>{r.speed.toFixed(1)} m/s</strong></p><p><span>系统时间 t</span><strong>{state.elapsed.toFixed(2)} s</strong></p><p><span>P 点位移 yₚ</span><strong>{r.displacement.toFixed(2)} cm</strong></p><p><span>P 点速度方向</span><strong>{r.velocity >= 0 ? '↑ 向上' : '↓ 向下'}</strong></p><p><span>波前到达时间</span><strong>{r.arrivalTime.toFixed(2)} s</strong></p><p className="mechanical-wave-graphs-conclusion"><span>图像关系</span><strong>y-x 是某一时刻的空间抓拍；y-t 是固定质点的振动历程，质点只在平衡位置附近振动。</strong></p></div>} chart={<MechanicalWaveGraphsChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停传播' : '继续传播', onClick: state.toggleRunning }, { key: 'reset', label: '重置状态', onClick: state.reset }]} chartVisible />
}

export default MechanicalWaveGraphsScene
