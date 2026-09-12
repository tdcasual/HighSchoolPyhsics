import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { ProjectileDataAnalysisChart } from './ProjectileDataAnalysisChart'
import { ProjectileDataAnalysisControls } from './ProjectileDataAnalysisControls'
import { ProjectileDataAnalysisRig3D } from './ProjectileDataAnalysisRig3D'
import { useProjectileDataAnalysisSceneState } from './useProjectileDataAnalysisSceneState'
import './projectile-data-analysis.css'

export function ProjectileDataAnalysisScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useProjectileDataAnalysisSceneState()
  const r = state.readings
  return <SceneLayout controls={<ProjectileDataAnalysisControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 0, 13], fov: 42 }} controls={{ target: [-1.2, 0.5, 0], minDistance: 7, maxDistance: 22, maxPolarAngle: Math.PI * 0.9 }} frameloop={state.running ? 'always' : 'demand'}><ProjectileDataAnalysisRig3D {...state} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="projectile-data-analysis-telemetry"><p><span>当前时间 t</span><strong>{r.time.toFixed(2)} s</strong></p><p><span>水平位移 x</span><strong>{r.x.toFixed(2)} m</strong></p><p><span>竖直位移 y</span><strong>{r.y.toFixed(2)} m</strong></p><p><span>速度分解</span><strong>vₓ={r.vx.toFixed(2)}，vᵧ={r.vy.toFixed(2)} m/s</strong></p><p><span>合速度方向</span><strong>{r.speed.toFixed(2)} m/s · {r.angleDeg.toFixed(1)}°</strong></p><p className="projectile-data-analysis-conclusion"><span>物理结论</span><strong>水平方向匀速、竖直方向自由落体；消去时间得到 y=(g/2v₀²)x²。</strong></p></div>} chart={<ProjectileDataAnalysisChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停运动' : '继续运动', onClick: state.toggleRunning }, { key: 'reset', label: '重置状态', onClick: state.reset }]} chartVisible />
}

export default ProjectileDataAnalysisScene
