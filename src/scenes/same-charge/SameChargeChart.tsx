import { buildSameChargeTrace } from './model'
import type { SameChargeSceneState } from './useSameChargeSceneState'

type Props = { state: SameChargeSceneState }
const WIDTH = 420
const HEIGHT = 210
const PAD = { left: 44, right: 18, top: 22, bottom: 30 }

export function SameChargeChart({ state }: Props) {
  const trace = buildSameChargeTrace(state, 41)
  const maxE = Math.max(...trace.map(([, field]) => field), 1)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (separation: number) => PAD.left + (separation - 2) / 4 * innerWidth
  const plotY = (value: number) => PAD.top + (1 - value / maxE) * innerHeight
  const points = trace.map(([separation, field]) => `${plotX(separation)},${plotY(field)}`).join(' ')
  return <div className="same-charge-chart-shell"><div className="same-charge-chart-heading"><h3>中垂线场强—间距关系</h3><span>{state.running ? '动态场' : '已暂停'}</span></div><svg className="same-charge-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="等量同种电荷中垂线场强关系图"><g className="same-charge-grid">{Array.from({ length: 5 }, (_, index) => <line key={`h-${index}`} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * innerHeight / 4} y2={PAD.top + index * innerHeight / 4} />)}{Array.from({ length: 5 }, (_, index) => <line key={`v-${index}`} x1={PAD.left + index * innerWidth / 4} x2={PAD.left + index * innerWidth / 4} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}</g><line className="same-charge-axis" x1={PAD.left} x2={WIDTH - PAD.right} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom} /><line className="same-charge-axis" x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><polyline className="same-charge-trace" points={points} /><line className="same-charge-current" x1={plotX(state.separation)} x2={plotX(state.separation)} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><circle className="same-charge-point" cx={plotX(state.separation)} cy={plotY(state.readings.totalMagnitude)} r="5" /><text x={PAD.left} y="14">|E| / N·C⁻¹</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">2d / cm</text></svg><div className="same-charge-chart-legend"><span><i className="same-charge-dot" />探针 P 处合场强</span><span>中垂线 x=0</span></div></div>
}
