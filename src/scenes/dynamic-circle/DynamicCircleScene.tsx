import { InteractiveCanvas } from '../../scene3d/InteractiveCanvas'
import { useAppStore } from '../../store/useAppStore'
import { SceneLayout } from '../../ui/layout/SceneLayout'
import { DynamicCircleChart } from './DynamicCircleChart'
import { DynamicCircleControls } from './DynamicCircleControls'
import { DynamicCircleRig3D } from './DynamicCircleRig3D'
import { useDynamicCircleSceneState } from './useDynamicCircleSceneState'
import './dynamic-circle.css'

const modeLabel = { scaling: '放缩圆', rotating: '旋转圆', translating: '平移圆', comprehensive: '综合聚焦' } as const
const boundaryLabel = { straight: '直线/矩形', triangle: '三角形', circle: '圆形' } as const

export function DynamicCircleScene() {
  const theme = useAppStore((state) => state.theme)
  const state = useDynamicCircleSceneState()
  const r = state.readings
  const statusLabel = r.status === 'escaped' ? '粒子飞出磁场' : r.status === 'critical' ? '临界切触' : '安全束缚'
  return <SceneLayout controls={<DynamicCircleControls state={state} />} viewport={<InteractiveCanvas camera={{ position: [0, 0, 14], fov: 42 }} controls={{ target: [0, 0, 0], minDistance: 7, maxDistance: 20, maxPolarAngle: Math.PI * 0.9 }} frameloop={state.running ? 'always' : 'demand'}><DynamicCircleRig3D {...state} theme={theme} /></InteractiveCanvas>} dataOverlay={<div className="dynamic-circle-telemetry"><p><span>当前方法</span><strong>{modeLabel[state.mode]}</strong></p><p><span>边界形状</span><strong>{boundaryLabel[state.boundary]}</strong></p><p><span>轨道半径 R</span><strong>{Number.isFinite(r.radius) ? `${r.radius.toFixed(1)} mm` : '∞'}</strong></p><p><span>回旋周期 T</span><strong>{Number.isFinite(r.cyclotronPeriod) ? `${r.cyclotronPeriod.toFixed(2)} s` : '∞'}</strong></p><p><span>偏转角</span><strong>{r.deflectionDeg.toFixed(1)}°</strong></p><p><span>状态</span><strong className={`dynamic-circle-status ${r.status}`}>{statusLabel}</strong></p><p className="dynamic-circle-conclusion"><span>物理关系</span><strong>{state.B === 0 ? 'B = 0：粒子沿切线方向做匀速直线运动' : `洛伦兹力 qvB 提供向心力，R = mv / |qB|；临界半径 ${r.criticalRadius.toFixed(1)} mm`}</strong></p></div>} chart={<DynamicCircleChart state={state} />} playbackActions={[{ key: 'toggle-running', label: state.running ? '暂停轨迹' : '继续轨迹', onClick: state.toggleRunning }, { key: 'reset', label: '重置参数', onClick: state.reset }]} chartVisible />
}

export default DynamicCircleScene
