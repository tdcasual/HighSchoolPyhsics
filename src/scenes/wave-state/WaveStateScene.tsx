import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { WaveStateChart } from './WaveStateChart'
import { WaveStateControls } from './WaveStateControls'
import { WaveStateRig3D } from './WaveStateRig3D'
import { useWaveStateSceneState } from './useWaveStateSceneState'
import './wave-state.css'

export function WaveStateScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useWaveStateSceneState()
  const r = state.readings
  const directionLabel = state.direction === 'right' ? '向右传播' : '向左传播'
  const velocityLabel = r.probe.velocityDirection === 'up' ? '↑ 向上' : r.probe.velocityDirection === 'down' ? '↓ 向下' : '0 静止'
  const accelerationLabel = r.probe.accelerationDirection === 'up' ? '↑ 向上（指向平衡位置）' : r.probe.accelerationDirection === 'down' ? '↓ 向下（指向平衡位置）' : '0 静止'
  return <SceneLayout
    controls={<WaveStateControls state={state} />}
    viewport={<InteractiveCanvas camera={{ position: [0, 0, 14], fov: 42 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 20, maxPolarAngle: Math.PI * 0.9 }} frameloop={state.running ? 'always' : 'demand'}><WaveStateRig3D {...state} theme={theme} /></InteractiveCanvas>}
    dataOverlay={<div className="wave-state-telemetry"><p><span>传播方向</span><strong>{directionLabel}</strong></p><p><span>波速 v=λ/T</span><strong>{r.waveSpeed.toFixed(2)} m/s</strong></p><p><span>当前时刻 t</span><strong>{state.elapsed.toFixed(2)} s</strong></p><p><span>P 点瞬时速度方向</span><strong className="wave-state-velocity-value">{velocityLabel}</strong></p><p><span>P 点加速度方向</span><strong className="wave-state-acceleration-value">{accelerationLabel}</strong></p><p className="wave-state-conclusion"><span>物理结论</span><strong>波形沿 x 轴传播，介质质点只在各自平衡位置附近做 y 方向简谐振动，不随波逐流。</strong></p></div>}
    chart={<WaveStateChart state={state} />}
    playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停传播' : '继续传播', onClick: state.toggleRunning }, { key: 'reset', label: '重置相位', onClick: state.reset }]}
    chartVisible
  />
}

export default WaveStateScene
