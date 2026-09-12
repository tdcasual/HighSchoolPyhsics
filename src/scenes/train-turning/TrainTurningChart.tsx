import { buildForceTrace } from './model'
import type { TrainTurningSceneState } from './useTrainTurningSceneState'

type Props = { state: TrainTurningSceneState }
const WIDTH = 420
const HEIGHT = 220
const PAD = { left: 44, right: 18, top: 22, bottom: 30 }

export function TrainTurningChart({ state }: Props) {
  const trace = buildForceTrace({ speed: state.speed, angleDeg: state.angleDeg, radius: state.radius }, 81)
  const maxSpeed = trace[trace.length - 1][0]
  const maxForce = Math.max(...trace.map(([, side]) => Math.abs(side)), 1)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (speed: number) => PAD.left + speed / maxSpeed * innerWidth
  const plotY = (force: number) => PAD.top + (1 - (force + maxForce) / (2 * maxForce)) * innerHeight
  const points = trace.map(([speed, side]) => String(plotX(speed)) + ',' + String(plotY(side))).join(' ')
  const idealX = plotX(state.readings.idealSpeed)
  const currentX = plotX(state.speed)
  const currentY = plotY(state.readings.sideForce)
  return <div className="train-turning-chart-shell"><div className="train-turning-chart-heading"><h3>侧向力与实际速度</h3><span>{state.running ? '运动中' : '已暂停'} · F侧(v)</span></div><svg className="train-turning-chart" viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT} role="img" aria-label="火车转弯侧向力速度关系图"><g className="train-turning-grid">{Array.from({ length: 5 }, (_, index) => <line key={'h-' + index} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * innerHeight / 4} y2={PAD.top + index * innerHeight / 4} />)}{Array.from({ length: 5 }, (_, index) => <line key={'v-' + index} x1={PAD.left + index * innerWidth / 4} x2={PAD.left + index * innerWidth / 4} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}</g><line className="train-turning-axis" x1={PAD.left} y1={plotY(0)} x2={WIDTH - PAD.right} y2={plotY(0)} /><line className="train-turning-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} /><polyline className="train-turning-force-curve" points={points} /><line className="train-turning-ideal" x1={idealX} x2={idealX} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><line className="train-turning-tracker" x1={currentX} x2={currentX} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><circle className="train-turning-point" cx={currentX} cy={currentY} r="5" /><text x={PAD.left} y="14">F侧 / N</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">v / m·s⁻¹</text><text x={idealX + 4} y={PAD.top + 12} className="train-turning-ideal-label">v₀={state.readings.idealSpeed.toFixed(1)}</text><text x={currentX - 4} y={currentY - 8} textAnchor="end" className="train-turning-current-label">{state.readings.sideForce.toFixed(0)} N</text></svg><div className="train-turning-chart-legend"><span><i className="train-turning-legend-dot force" />侧向力 F侧</span><span><i className="train-turning-legend-dot ideal" />理想速度 v₀</span></div></div>
}
