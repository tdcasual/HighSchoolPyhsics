import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { ForceParallelogramChart } from './ForceParallelogramChart'
import { ForceParallelogramControls } from './ForceParallelogramControls'
import { ForceParallelogramRig3D } from './ForceParallelogramRig3D'
import { useForceParallelogramSceneState } from './useForceParallelogramSceneState'
import './force-parallelogram.css'

export function ForceParallelogramScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useForceParallelogramSceneState()
  const r = state.readings
  return <SceneLayout controls={<ForceParallelogramControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 0, 14], fov: 40 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 18, maxPolarAngle: Math.PI * 0.92 }} frameloop={state.running ? 'always' : 'demand'}><ForceParallelogramRig3D elapsed={state.elapsed} step={state.step} f1={state.f1} f2={state.f2} readings={r} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="force-parallelogram-telemetry"><p><span>理论合力 F</span><strong>{r.theoreticalMagnitude.toFixed(2)} N</strong></p><p><span>实验测合力 F′</span><strong>{r.measuredMagnitude.toFixed(2)} N</strong></p><p><span>大小相对误差</span><strong>{r.magnitudeErrorPercent.toFixed(1)}%</strong></p><p><span>方向偏角误差</span><strong>{r.angleErrorDeg.toFixed(1)}°</strong></p><p><span>当前夹角 θ</span><strong>{state.angleDeg.toFixed(0)}°</strong></p><p className="force-parallelogram-conclusion"><span>实验结论</span><strong>{state.step === 'compare' ? '理论合力与实测合力大小、方向在误差范围内重合，验证了力的平行四边形定则。' : '按步骤完成矢量作图，再进行理论值与实测值对比。'}</strong></p></div>} chart={<ForceParallelogramChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停画面' : '继续画面', onClick: state.toggleRunning }, { key: 'reset', label: '重置虚拟实验', onClick: state.reset }]} chartVisible />
}

export default ForceParallelogramScene
