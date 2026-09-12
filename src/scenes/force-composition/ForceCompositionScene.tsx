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
  return <SceneLayout controls={<ForceCompositionControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 1.5, 14], fov: 42 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 20, maxPolarAngle: Math.PI * 0.9 }} frameloop={state.running ? 'always' : 'demand'}><ForceCompositionRig3D {...state} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="force-composition-telemetry"><p><span>当前模式</span><strong>{state.mode === 'synthesis' ? '合成法则' : state.mode === 'range' ? '合力范围' : state.mode === 'orthogonal' ? '正交分解' : '按效果分解'}</strong></p>{state.mode === 'synthesis' && <><p><span>分力 F₁ / F₂</span><strong>{r.f1Magnitude.toFixed(1)} / {r.f2Magnitude.toFixed(1)} N</strong></p><p><span>两力夹角 θ</span><strong>{r.angleDeg.toFixed(1)}°</strong></p><p><span>合力 F合</span><strong>{r.sumMagnitude.toFixed(1)} N</strong></p></>}{state.mode === 'range' && <><p><span>合力最大值</span><strong>{r.rangeMax.toFixed(1)} N</strong></p><p><span>合力最小值</span><strong>{r.rangeMin.toFixed(1)} N</strong></p><p><span>当前合力</span><strong>{r.rangeCurrent.toFixed(1)} N</strong></p></>}{state.mode === 'orthogonal' && <><p><span>Fx</span><strong>{r.fx.toFixed(1)} N</strong></p><p><span>Fy</span><strong>{r.fy.toFixed(1)} N</strong></p></>}{state.mode === 'effect' && <><p><span>下滑分力 G₁</span><strong>{r.downSlope.toFixed(1)} N</strong></p><p><span>法向分力 G₂</span><strong>{r.normal.toFixed(1)} N</strong></p></>}<p className="force-composition-conclusion"><span>关系</span><strong>{state.mode === 'effect' ? 'G₁ = G·sinθ，G₂ = G·cosθ' : state.mode === 'orthogonal' ? 'F² = Fx² + Fy²' : 'F合² = F₁² + F₂² + 2F₁F₂cosθ'}</strong></p></div>} chart={<ForceCompositionChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停演变' : '继续演变', onClick: state.toggleRunning }, { key: 'reset', label: '重置参数', onClick: state.reset }]} chartVisible={true} />
}

export default ForceCompositionScene

