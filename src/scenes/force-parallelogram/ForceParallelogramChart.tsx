import { buildForceComparison } from './model'
import type { ForceParallelogramSceneState } from './useForceParallelogramSceneState'

type Props = { state: ForceParallelogramSceneState }
const WIDTH = 420
const HEIGHT = 210
const PAD = { left: 44, right: 18, top: 22, bottom: 30 }

export function ForceParallelogramChart({ state }: Props) {
  const trace = buildForceComparison(state, 41)
  const maxY = Math.max(...trace.flatMap(([, theoretical]) => [theoretical]), 1)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (angle: number) => PAD.left + (angle - 10) / 160 * innerWidth
  const plotY = (value: number) => PAD.top + (1 - value / maxY) * innerHeight
  const theoretical = trace.map(([angle, value]) => `${plotX(angle)},${plotY(value)}`).join(' ')
  const measured = trace.map(([angle, , value]) => `${plotX(angle)},${plotY(value)}`).join(' ')
  return <div className="force-parallelogram-chart-shell"><div className="force-parallelogram-chart-heading"><h3>合力随夹角关系</h3><span>{state.running ? '动态实验' : '已暂停'}</span></div><svg className="force-parallelogram-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="平行四边形定则合力夹角关系图"><g className="force-parallelogram-grid">{Array.from({ length: 5 }, (_, index) => <line key={`h-${index}`} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * innerHeight / 4} y2={PAD.top + index * innerHeight / 4} />)}{Array.from({ length: 5 }, (_, index) => <line key={`v-${index}`} x1={PAD.left + index * innerWidth / 4} x2={PAD.left + index * innerWidth / 4} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}</g><line className="force-parallelogram-axis" x1={PAD.left} x2={WIDTH - PAD.right} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom} /><line className="force-parallelogram-axis" x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><polyline className="force-parallelogram-theory" points={theoretical} /><polyline className="force-parallelogram-measured" points={measured} /><line className="force-parallelogram-current" x1={plotX(state.angleDeg)} x2={plotX(state.angleDeg)} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><circle className="force-parallelogram-point" cx={plotX(state.angleDeg)} cy={plotY(state.readings.theoreticalMagnitude)} r="5" /><text x={PAD.left} y="14">F / N</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">θ / °</text><text x={PAD.left + 6} y={PAD.top + 13} className="force-parallelogram-theory-label">理论 F</text><text x={PAD.left + 56} y={PAD.top + 13} className="force-parallelogram-measured-label">实测 F′</text></svg><div className="force-parallelogram-chart-legend"><span><i className="force-parallelogram-dot theory" />理论合力 F</span><span><i className="force-parallelogram-dot measured" />实测合力 F′</span></div></div>
}
