import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { FaradayDiscChart } from './FaradayDiscChart'
import { FaradayDiscControls } from './FaradayDiscControls'
import { FaradayDiscRig3D } from './FaradayDiscRig3D'
import { useFaradayDiscSceneState } from './useFaradayDiscSceneState'
import './faraday-disc.css'

export function FaradayDiscScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useFaradayDiscSceneState()
  const r = state.readings
  return <SceneLayout controls={<FaradayDiscControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 0, 15], fov: 42 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 22, maxPolarAngle: Math.PI * 0.9 }} frameloop={state.running ? 'always' : 'demand'}><FaradayDiscRig3D {...state} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="faraday-disc-telemetry"><p><span>感应电动势 E</span><strong>{r.emf.toFixed(3)} V</strong></p><p><span>回路总电流 I</span><strong>{r.current.toFixed(3)} A</strong></p><p><span>外电路功率 P外</span><strong>{r.power.toFixed(4)} W</strong></p><p><span>安培阻力矩 M安</span><strong>{r.torque.toFixed(4)} N·m</strong></p><p><span>等效电源极性</span><strong>{r.polarity}</strong></p><p className="faraday-disc-conclusion"><span>能量关系</span><strong>{state.circuit === 'closed' ? '闭合：外部驱动功率转化为电路电功率，电荷从低电势 A 向高电势 B 移动。' : '断开：圆心—边缘保持电势差，外电路无持续电流。'}</strong></p></div>} chart={<FaradayDiscChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停转动' : '继续转动', onClick: state.toggleRunning }, { key: 'reset', label: '重置实验', onClick: state.reset }]} chartVisible />
}

export default FaradayDiscScene
