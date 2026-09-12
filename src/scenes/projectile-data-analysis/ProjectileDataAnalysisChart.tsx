import { buildFlashPoints, buildTrajectoryTrace } from './model'
import type { ProjectileDataAnalysisSceneState } from './useProjectileDataAnalysisSceneState'

type Props = { state: ProjectileDataAnalysisSceneState }
const WIDTH = 420
const HEIGHT = 230
const PAD = { left: 42, right: 22, top: 22, bottom: 34 }
export function ProjectileDataAnalysisChart({ state }: Props) {
  const params = { initialSpeed: state.initialSpeed, gravity: state.gravity, flashPeriod: state.flashPeriod }
  const trace = buildTrajectoryTrace(params, 81)
  const flashPoints = buildFlashPoints(params, 5)
  const maxX = Math.max(2.5, trace.at(-1)?.[0] ?? 2.5)
  const maxY = Math.max(2.2, trace.at(-1)?.[1] ?? 2.2)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (x: number) => PAD.left + x / maxX * innerWidth
  const plotY = (y: number) => PAD.top + y / maxY * innerHeight
  const line = trace.map(([x, y]) => `${plotX(x)},${plotY(y)}`).join(' ')
  return <div className="projectile-data-analysis-chart-shell"><div className="projectile-data-analysis-chart-heading"><h3>轨迹方程与频闪数据</h3><span>{state.running ? '运动中' : '已暂停'} · y={state.readings.trajectoryCoefficient.toFixed(3)}x²</span></div><svg className="projectile-data-analysis-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="平抛运动轨迹与频闪数据图"><g className="projectile-data-analysis-grid">{Array.from({ length: 5 }, (_, index) => <line key={`h-${index}`} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * innerHeight / 4} y2={PAD.top + index * innerHeight / 4} />)}{Array.from({ length: 5 }, (_, index) => <line key={`v-${index}`} x1={PAD.left + index * innerWidth / 4} x2={PAD.left + index * innerWidth / 4} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}</g><line className="projectile-data-analysis-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} /><line className="projectile-data-analysis-axis" x1={PAD.left} y1={PAD.top} x2={WIDTH - PAD.right} y2={PAD.top} /><polyline className="projectile-data-analysis-curve" points={line} />{flashPoints.map((point) => <circle key={point.index} className="projectile-data-analysis-point" cx={plotX(point.x)} cy={plotY(point.y)} r="4" />)}<circle className="projectile-data-analysis-current" cx={plotX(state.readings.x)} cy={plotY(state.readings.y)} r="4.8" /><text x={PAD.left} y="14">y / m</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">x / m</text><text x={PAD.left - 5} y={PAD.top + 4} textAnchor="end">0</text><text x={WIDTH - PAD.right} y={PAD.top + 14} textAnchor="end" className="projectile-data-analysis-label">理想抛物线</text></svg><div className="projectile-data-analysis-legend"><span><i className="projectile-data-analysis-legend-dot curve" />理想轨迹</span><span><i className="projectile-data-analysis-legend-dot point" />频闪点</span><span><i className="projectile-data-analysis-legend-dot current" />当前质点</span></div></div>
}
