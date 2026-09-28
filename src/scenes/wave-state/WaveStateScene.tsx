import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useMediaQuery } from '../../ui/hooks/useMediaQuery'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { WaveStateChart } from './WaveStateChart'
import { WaveStateControls } from './WaveStateControls'
import { WaveStateRig3D } from './WaveStateRig3D'
import { useWaveStateSceneState } from './useWaveStateSceneState'
import './wave-state.css'
export function WaveStateScene() {
  const theme = useAppStore((state) => state.theme)
  const isCompactDesktop = useMediaQuery('(min-width: 768px) and (max-width: 1100px)')
  const state = useWaveStateSceneState()
  const r = state.readings
  const directionLabel = state.direction === 'right' ? '向右传播' : '向左传播'
  const velocityLabel = !r.probeReached ? '尚未起振' : r.probe.velocityDirection === 'up' ? '↑ 向上' : r.probe.velocityDirection === 'down' ? '↓ 向下' : '0 瞬时静止'
  const accelerationLabel = !r.probeReached ? '尚未起振' : r.probe.accelerationDirection === 'up' ? '↑ 向上（指向平衡位置）' : r.probe.accelerationDirection === 'down' ? '↓ 向下（指向平衡位置）' : '0 平衡位置'
  const probeStatus = r.probeReached ? '已起振' : '尚未起振 · 预计 t=' + r.probeArrivalTime.toFixed(2) + ' s 到达'
  return <SceneLayout
    controls={<WaveStateControls state={state}/>}
    panelPlacement={isCompactDesktop ? 'after-sidebar' : 'default'}
    auxiliaryPanelPlacement={isCompactDesktop ? 'default' : 'after-sidebar'}
    viewport={<InteractiveCanvas camera={{position:[0,0,14],fov:42}} controls={{target:[0,0,0],minDistance:7,maxDistance:20,maxPolarAngle:Math.PI*0.9}} frameloop={state.running?'always':'demand'}><WaveStateRig3D {...state} theme={theme}/></InteractiveCanvas>}
    dataOverlay={<div className="wave-state-telemetry"><p><span>传播方向</span><strong>{directionLabel}</strong></p><p><span>波速 v=λ/T</span><strong>{r.waveSpeed.toFixed(2)} m/s</strong></p><p><span>频率 f=1/T</span><strong>{r.frequency.toFixed(2)} Hz</strong></p><p><span>当前时刻 t</span><strong data-testid="wave-state-sim-time">{state.elapsed.toFixed(2)} s</strong></p><p><span>波前位置</span><strong data-testid="wave-state-front-position">{r.wavefrontX.toFixed(2)} m</strong></p><p><span>P 点 x₀ / 状态</span><strong data-testid="wave-state-probe-status">{state.probeX.toFixed(1)} m · {probeStatus}</strong></p><p><span>P 点瞬时速度</span><strong className="wave-state-velocity-value">{velocityLabel}</strong></p><p><span>P 点加速度方向</span><strong className="wave-state-acceleration-value">{accelerationLabel}</strong></p><p className="wave-state-conclusion"><span>物理结论</span><strong>波前以 v=λ/T 传播；到达 P 点后，质点才按起振方向做简谐振动，质点不随波迁移。</strong></p></div>}
    chart={<WaveStateChart state={state}/>}
    playbackActions={[{key:'toggle-running',label:state.running?'暂停传播':state.elapsed===0?'开始传播':'继续传播',onClick:state.toggleRunning},{key:'reset',label:'重置相位',onClick:state.reset}]}
    chartVisible
    dataInitiallyCollapsed
    chartInitiallyCollapsed
  />
}
export default WaveStateScene
