import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { BulletBlockChart } from './BulletBlockChart'
import { BulletBlockControls } from './BulletBlockControls'
import { BulletBlockRig3D } from './BulletBlockRig3D'
import { useBulletBlockSceneState } from './useBulletBlockSceneState'
import './bullet-block.css'
export function BulletBlockScene() { const theme = useAppStore((state) => state.theme); const state = useBulletBlockSceneState(); const r = state.readings; return <SceneLayout controls={<BulletBlockControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 0.2, 13], fov: 42 }} controls={{ target: [0, -0.45, 0], minDistance: 7, maxDistance: 23, maxPolarAngle: Math.PI * 0.9 }} frameloop={state.running ? 'always' : 'demand'}><BulletBlockRig3D {...state} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="bullet-block-telemetry"><p><span>碰撞阶段</span><strong>{r.phase === 'approach' ? '碰撞前' : r.phase === 'collision' ? '嵌入碰撞中' : '共速后'}</strong></p><p><span>实时总动量</span><strong>{r.totalMomentum.toFixed(2)} kg·m/s</strong></p><p><span>理论共速</span><strong>{r.commonSpeed.toFixed(2)} m/s</strong></p><p><span>嵌入深度</span><strong>{r.penetration.toFixed(2)} / {r.maximumPenetration.toFixed(2)} m</strong></p><p><span>内能增加 Q</span><strong>{r.heat.toFixed(1)} J</strong></p><p className="bullet-block-conclusion"><span>物理结论</span><strong>光滑面上系统外力合冲量为零，子弹与木块共速后保持匀速；损失的机械能转化为内能。</strong></p></div>} chart={<BulletBlockChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停运动' : '继续运动', onClick: state.toggleRunning }, { key: 'reset', label: '重置状态', onClick: state.reset }]} chartVisible /> }
export default BulletBlockScene
