import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { TrainTurningChart } from './TrainTurningChart'
import { TrainTurningControls } from './TrainTurningControls'
import { TrainTurningRig3D } from './TrainTurningRig3D'
import { useTrainTurningSceneState } from './useTrainTurningSceneState'
import './train-turning.css'

export function TrainTurningScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useTrainTurningSceneState()
  const r = state.readings
  const statusLabel = r.status === 'ideal' ? '理想临界状态' : r.status === 'high' ? '速度偏大' : '速度偏小'
  return <SceneLayout controls={<TrainTurningControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 0, 15], fov: 42 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 22, maxPolarAngle: Math.PI * 0.9 }} frameloop={state.running ? 'always' : 'demand'}><TrainTurningRig3D {...state} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="train-turning-telemetry"><p><span>当前状态</span><strong className={'train-turning-status ' + r.status}>{statusLabel}</strong></p><p><span>当前需向心力 F合</span><strong>{r.resultantForce.toFixed(0)} N</strong></p><p><span>临界安全速度 v₀</span><strong>{r.idealSpeed.toFixed(1)} m/s</strong></p><p><span>轨道面支持力 Fₙ</span><strong>{r.normalForce.toFixed(0)} N</strong></p><p><span>轮缘侧向力 F侧</span><strong>{r.sideForce.toFixed(0)} N</strong></p><p className="train-turning-conclusion"><span>受力结论</span><strong>{r.status === 'ideal' ? 'v=v₀：重力与支持力的合力恰好提供向心力，轮缘无侧向挤压。' : r.status === 'high' ? 'v＞v₀：所需向心力增大，外轨需提供额外的向内侧向力。' : 'v＜v₀：所需向心力不足，内轨侧向力补偿合力方向。'}</strong></p></div>} chart={<TrainTurningChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停轨迹' : '继续轨迹', onClick: state.toggleRunning }, { key: 'reset', label: '重置参数', onClick: state.reset }]} chartVisible />
}

export default TrainTurningScene
