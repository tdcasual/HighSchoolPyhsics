import { buildBinaryStarsTrace } from './model'
import type { BinaryStarsSceneState } from './useBinaryStarsSceneState'

type Props = { state: BinaryStarsSceneState }
const WIDTH = 420
const HEIGHT = 210
const PAD = { left: 44, right: 18, top: 22, bottom: 30 }

export function BinaryStarsChart({ state }: Props) {
  const trace = buildBinaryStarsTrace(state, 51)
  const maxY = Math.max(...trace.flatMap(([, r1, r2]) => [r1, r2]), 1)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (mass: number) => PAD.left + (mass - 1) / 5 * innerWidth
  const plotY = (radius: number) => PAD.top + (1 - radius / maxY) * innerHeight
  const r1Points = trace.map(([mass, radius1]) => `${plotX(mass)},${plotY(radius1)}`).join(' ')
  const r2Points = trace.map(([mass, , radius2]) => `${plotX(mass)},${plotY(radius2)}`).join(' ')
  return <div className="binary-stars-chart-shell"><div className="binary-stars-chart-heading"><h3>质量—轨道半径关系</h3><span>{state.running ? '双星运动中' : '已暂停'}</span></div><svg className="binary-stars-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="双星质量轨道半径关系图"><g className="binary-stars-grid">{Array.from({ length: 5 }, (_, index) => <line key={`h-${index}`} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * innerHeight / 4} y2={PAD.top + index * innerHeight / 4} />)}{Array.from({ length: 6 }, (_, index) => <line key={`v-${index}`} x1={PAD.left + index * innerWidth / 5} x2={PAD.left + index * innerWidth / 5} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}</g><line className="binary-stars-axis" x1={PAD.left} x2={WIDTH - PAD.right} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom} /><line className="binary-stars-axis" x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><polyline className="binary-stars-r1" points={r1Points} /><polyline className="binary-stars-r2" points={r2Points} /><line className="binary-stars-current" x1={plotX(state.mass1)} x2={plotX(state.mass1)} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><circle className="binary-stars-point" cx={plotX(state.mass1)} cy={plotY(state.readings.radius1)} r="5" /><text x={PAD.left} y="14">r / R</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">m₁ / M</text><text x={PAD.left + 6} y={PAD.top + 13} className="binary-stars-r1-label">r₁</text><text x={PAD.left + 38} y={PAD.top + 13} className="binary-stars-r2-label">r₂</text></svg><div className="binary-stars-chart-legend"><span><i className="binary-stars-dot r1" />星球 1 轨道半径 r₁</span><span><i className="binary-stars-dot r2" />星球 2 轨道半径 r₂</span></div></div>
}
