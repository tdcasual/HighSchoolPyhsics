import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { CentripetalFactorsChart } from './CentripetalFactorsChart'
import { CentripetalFactorsControls } from './CentripetalFactorsControls'
import { CentripetalFactorsRig3D } from './CentripetalFactorsRig3D'
import { useCentripetalFactorsSceneState } from './useCentripetalFactorsSceneState'
import './centripetal-factors.css'

export function CentripetalFactorsScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useCentripetalFactorsSceneState()
  const r = state.readings
  return <SceneLayout controls={<CentripetalFactorsControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 0, 14], fov: 40 }} controls={{ target: [0, 0, 0], minDistance: 8, maxDistance: 20, maxPolarAngle: Math.PI * 0.92 }} frameloop={state.running ? 'always' : 'demand'}><CentripetalFactorsRig3D elapsed={state.elapsed} readings={r} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="centripetal-factors-telemetry"><p><span>探究变量</span><strong>{state.preset === 'mass' ? '质量 m' : state.preset === 'radius' ? '半径 r' : '角速度 ω'}</strong></p><p><span>ω左 / ω右</span><strong>{r.leftOmega.toFixed(2)} / {r.rightOmega.toFixed(2)}</strong></p><p><span>F左</span><strong>{r.leftForce.toFixed(1)} N · {r.leftFactor.toFixed(2)} F₀</strong></p><p><span>F右</span><strong>{r.rightForce.toFixed(1)} N · {r.rightFactor.toFixed(2)} F₀</strong></p><p><span>线速度 v左 / v右</span><strong>{r.leftVelocity.toFixed(2)} / {r.rightVelocity.toFixed(2)} m·s⁻¹</strong></p><p className="centripetal-factors-conclusion"><span>瞬时向心力计算公式</span><strong>F = m · ω² · r；F左 / F右 = {r.forceRatio.toFixed(2)}</strong></p></div>} chart={<CentripetalFactorsChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停演示' : '继续演示', onClick: state.toggleRunning }, { key: 'reset', label: '重置状态', onClick: state.reset }]} chartVisible />
}

export default CentripetalFactorsScene
