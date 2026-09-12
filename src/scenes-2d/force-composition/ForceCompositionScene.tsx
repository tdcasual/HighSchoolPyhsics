import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { ForceCompositionChart } from './ForceCompositionChart'
import { ForceCompositionControls } from './ForceCompositionControls'
import { ForceCompositionRig3D } from './ForceCompositionRig3D'
import { useForceCompositionSceneState } from './useForceCompositionSceneState'
import './force-composition.css'

export function ForceCompositionScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useForceCompositionSceneState()
  const r = state.readings
  const isScanning = state.mode === 'range' && state.rangeSweep
  const modeLabel = state.mode === 'synthesis' ? '合成法则' : state.mode === 'range' ? '合力范围' : state.mode === 'orthogonal' ? '正交分解' : '按效果分解'
  const relation = state.mode === 'effect'
    ? 'G∥ = G·sinθ，G⊥ = G·cosθ'
    : state.mode === 'orthogonal'
      ? 'Fx = Fcosθ，Fy = Fsinθ'
      : state.mode === 'range'
        ? '|F₁−F₂| ≤ F合 ≤ F₁+F₂'
        : 'F合² = F₁² + F₂² + 2F₁F₂cosθ'
  return <SceneLayout
    controls={<ForceCompositionControls state={state} />}
    viewport={<InteractiveCanvas camera={{ position: [0, 1.5, 14], fov: 42 }} adaptiveFraming={false} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 20, enableRotate: false, enablePan: false }} frameloop={isScanning && state.running ? 'always' : 'demand'}><ForceCompositionRig3D {...state} theme={theme} /></InteractiveCanvas>}
    dataOverlay={<div className="force-composition-telemetry">
      <p><span>当前模式</span><strong>{modeLabel}</strong></p>
      {state.mode === 'synthesis' && <><p><span>分力 F₁ / F₂</span><strong>{r.f1Magnitude.toFixed(1)} / {r.f2Magnitude.toFixed(1)} N</strong></p><p><span>两力夹角 θ</span><strong>{r.angleDeg.toFixed(1)}°</strong></p><p><span>合力 F合</span><strong>{r.sumMagnitude.toFixed(1)} N</strong></p></>}
      {state.mode === 'range' && <><p><span>当前夹角 θ</span><strong>{r.rangeAngleDeg.toFixed(1)}°</strong></p><p><span>最大 / 最小合力</span><strong>{r.rangeMax.toFixed(1)} / {r.rangeMin.toFixed(1)} N</strong></p><p><span>当前合力</span><strong>{r.rangeCurrent.toFixed(1)} N</strong></p></>}
      {state.mode === 'orthogonal' && <><p><span>合力 F / 方向角 θ</span><strong>{r.orthogonalMagnitude.toFixed(1)} N / {r.orthogonalAngleDeg.toFixed(1)}°</strong></p><p><span>水平分量 Fx</span><strong>{r.fx.toFixed(1)} N</strong></p><p><span>竖直分量 Fy</span><strong>{r.fy.toFixed(1)} N</strong></p></>}
      {state.mode === 'effect' && <><p><span>重力 G / 斜面角 θ</span><strong>{r.gravity.toFixed(1)} N / {r.slopeAngleDeg.toFixed(1)}°</strong></p><p><span>沿斜面分量 G∥</span><strong>{r.downSlope.toFixed(1)} N</strong></p><p><span>法向分量 G⊥</span><strong>{r.normal.toFixed(1)} N</strong></p></>}
      <p className="force-composition-conclusion"><span>关系</span><strong>{relation}</strong></p>
    </div>}
    chart={<ForceCompositionChart state={state} />}
    playbackActions={[...(isScanning ? [{ key: 'toggle-running', label: state.running ? '暂停扫描' : '继续扫描', onClick: state.toggleRunning }] : []), { key: 'reset', label: '重置参数', onClick: state.reset }]}
    chartVisible={true}
  />
}

export default ForceCompositionScene
