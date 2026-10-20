import { Answer } from '../../ui/notes/Answer'
import { clockActions } from '../../simulation/clockActions'
import { DataRows } from '../../ui/panels/DataRows'
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
  const velocityLabel = !r.probeReached ? '尚未起振' : r.probe.velocityDirection === 'up' ? '↑ 向上' : r.probe.velocityDirection === 'down' ? '↓ 向下' : '0 瞬时静止'
  const accelerationLabel = !r.probeReached ? '尚未起振' : r.probe.accelerationDirection === 'up' ? '↑ 向上（指向平衡位置）' : r.probe.accelerationDirection === 'down' ? '↓ 向下（指向平衡位置）' : '0 平衡位置'
  const probeStatus = r.probeReached ? '已起振' : '尚未起振 · 预计 t=' + r.probeArrivalTime.toFixed(2) + ' s 到达'
  return <SceneLayout
    controls={<WaveStateControls state={state}/>}
    viewport={<InteractiveCanvas camera={{position:[0,0,14],fov:42}} controls={{target:[0,0,0],minDistance:7,maxDistance:20,maxPolarAngle:Math.PI*0.9}} frameloop={state.running?'always':'demand'}><WaveStateRig3D {...state} theme={theme}/></InteractiveCanvas>}
    dataOverlay={<DataRows
          className="wave-state-telemetry"
          rows={[
            { label: '当前时刻 t', value: <>{state.elapsed.toFixed(2)} s</>, testId: 'wave-state-sim-time' },
            { label: '波前位置', value: <>{r.wavefrontX.toFixed(2)} m</>, testId: 'wave-state-front-position' },
            { label: 'P 点 x₀ / 状态', value: <>{state.probeX.toFixed(1)} m · <Answer>{probeStatus}</Answer></>, testId: 'wave-state-probe-status' },
            { label: 'P 点瞬时速度', value: velocityLabel, answer: true, valueClassName: 'wave-state-velocity-value' },
            { label: 'P 点加速度方向', value: accelerationLabel, answer: true, valueClassName: 'wave-state-acceleration-value' },
          ]}
        />}
    notes={<><p>{directionLabel}：波速 v = λ/T = {r.waveSpeed.toFixed(2)} m/s，频率 f = 1/T = {r.frequency.toFixed(2)} Hz。</p><p>波前以 v = λ/T 传播；到达 P 点后，质点才按起振方向做简谐振动，质点不随波迁移。</p></>}
    chart={<WaveStateChart state={state}/>}
    playbackActions={clockActions({ running: state.running, toggle: state.toggleRunning, step: state.step }, { playLabel: state.elapsed === 0 ? '开始传播' : '继续传播', pauseLabel: '暂停传播', stepLabel: '单步 T/4', resetLabel: '重置相位', onReset: state.reset })}
    chartVisible
    chartInitiallyCollapsed
  />
}
export default WaveStateScene
