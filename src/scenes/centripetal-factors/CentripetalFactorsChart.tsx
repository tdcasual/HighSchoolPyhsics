import { buildCentripetalTrace, type CentripetalPreset } from './model'
import type { CentripetalFactorsSceneState } from './useCentripetalFactorsSceneState'

type Props = { state: CentripetalFactorsSceneState }
const WIDTH = 430
const HEIGHT = 220
const PAD = { left: 46, right: 18, top: 24, bottom: 32 }

const presetLabel: Record<CentripetalPreset, string> = { mass: '质量 m / m₀', radius: '半径 r / r₀', angular: '角速度 ω / rad·s⁻¹' }

export function CentripetalFactorsChart({ state }: Props) {
  const trace = buildCentripetalTrace(state, 61)
  const minX = trace[0][0]
  const maxX = trace[trace.length - 1][0]
  const maxY = Math.max(...trace.flatMap(([, left, right]) => [left, right]), 1)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (value: number) => PAD.left + (value - minX) / Math.max(0.001, maxX - minX) * innerWidth
  const plotY = (value: number) => PAD.top + (1 - value / maxY) * innerHeight
  const leftPoints = trace.map(([x, left]) => `${plotX(x)},${plotY(left)}`).join(' ')
  const rightPoints = trace.map(([x, , right]) => `${plotX(x)},${plotY(right)}`).join(' ')
  const currentX = state.preset === 'mass' ? state.leftMassMultiple : state.preset === 'radius' ? state.leftRadiusMultiple : state.omegaBase
  const currentReadings = state.readings
  return <div className="centripetal-factors-chart-shell"><div className="centripetal-factors-chart-heading"><h3>控制变量关系图</h3><span>{state.running ? '演示中' : '已暂停'} · F = mω²r</span></div><svg className="centripetal-factors-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="向心力控制变量关系图"><g className="centripetal-factors-grid">{Array.from({ length: 5 }, (_, index) => <line key={`h-${index}`} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * innerHeight / 4} y2={PAD.top + index * innerHeight / 4} />)}{Array.from({ length: 5 }, (_, index) => <line key={`v-${index}`} x1={PAD.left + index * innerWidth / 4} x2={PAD.left + index * innerWidth / 4} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}</g><line className="centripetal-factors-axis" x1={PAD.left} x2={WIDTH - PAD.right} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom} /><line className="centripetal-factors-axis" x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><polyline className="centripetal-factors-left-curve" points={leftPoints} /><polyline className="centripetal-factors-right-curve" points={rightPoints} /><line className="centripetal-factors-tracker" x1={plotX(currentX)} x2={plotX(currentX)} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><circle className="centripetal-factors-left-point" cx={plotX(currentX)} cy={plotY(currentReadings.leftFactor)} r="5" /><text x={PAD.left} y="15">F / F₀</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">{presetLabel[state.preset]}</text><text x={PAD.left + 8} y={PAD.top + 13} className="centripetal-factors-left-label">左球</text><text x={PAD.left + 52} y={PAD.top + 13} className="centripetal-factors-right-label">右球</text><text x={plotX(currentX) - 5} y={plotY(currentReadings.leftFactor) - 9} textAnchor="end" className="centripetal-factors-current-label">{currentReadings.leftFactor.toFixed(2)}F₀</text></svg><div className="centripetal-factors-chart-legend"><span><i className="centripetal-factors-dot left" />左球 F左</span><span><i className="centripetal-factors-dot right" />右球 F右</span><span className="centripetal-factors-chart-note">当前 F左/F右={currentReadings.forceRatio.toFixed(2)}</span></div></div>
}
