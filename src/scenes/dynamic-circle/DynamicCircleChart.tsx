import { useMemo } from 'react'
import { buildRadiusTrace } from './model'
import type { DynamicCircleSceneState } from './useDynamicCircleSceneState'

type Props = { state: DynamicCircleSceneState }
const WIDTH = 420
const HEIGHT = 205
const PAD = { left: 42, right: 18, top: 20, bottom: 30 }

export function DynamicCircleChart({ state }: Props) {
  const trace = useMemo(() => buildRadiusTrace(state.B === 0 ? 0.1 : state.B, state.v, 13), [state.B, state.v])
  const maxRadius = Math.max(160, ...trace.map(([, radius]) => Math.min(radius, 620)))
  const plotX = (index: number) => PAD.left + index / (trace.length - 1) * (WIDTH - PAD.left - PAD.right)
  const plotY = (radius: number) => HEIGHT - PAD.bottom - Math.min(radius, maxRadius) / maxRadius * (HEIGHT - PAD.top - PAD.bottom)
  const points = trace.map(([, radius], index) => `${plotX(index)},${plotY(radius)}`).join(' ')
  const currentX = PAD.left + (state.v - 4) / 21 * (WIDTH - PAD.left - PAD.right)
  const currentY = plotY(state.readings.radius)
  return <div className="dynamic-circle-chart-shell"><div className="dynamic-circle-chart-heading"><h3>轨道半径与临界分析</h3><span>{state.running ? '轨迹演变中' : '已暂停'} · R = mv / |qB|</span></div><svg className="dynamic-circle-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="动态圆轨道半径分析图"><g className="dynamic-circle-grid">{Array.from({ length: 6 }, (_, index) => <line key={`h-${index}`} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * (HEIGHT - PAD.top - PAD.bottom) / 5} y2={PAD.top + index * (HEIGHT - PAD.top - PAD.bottom) / 5} />)}{Array.from({ length: 7 }, (_, index) => <line key={`v-${index}`} x1={PAD.left + index * (WIDTH - PAD.left - PAD.right) / 6} x2={PAD.left + index * (WIDTH - PAD.left - PAD.right) / 6} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}</g><line className="dynamic-circle-axis" x1={PAD.left} y1={HEIGHT - PAD.bottom} x2={WIDTH - PAD.right} y2={HEIGHT - PAD.bottom} /><line className="dynamic-circle-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} /><polyline className="dynamic-circle-radius-curve" points={points} /><line className="dynamic-circle-critical" x1={PAD.left} x2={WIDTH - PAD.right} y1={plotY(state.readings.criticalRadius)} y2={plotY(state.readings.criticalRadius)} /><line className="dynamic-circle-tracker" x1={currentX} x2={currentX} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><circle className="dynamic-circle-point" cx={currentX} cy={currentY} r="5" /><text x={PAD.left} y="13">R / mm</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">v / m·s⁻¹</text><text className="dynamic-circle-critical-label" x={WIDTH - PAD.right - 4} y={plotY(state.readings.criticalRadius) - 5} textAnchor="end">临界 R={state.readings.criticalRadius.toFixed(0)}</text></svg><div className="dynamic-circle-chart-legend"><span><i className="dynamic-circle-legend-dot radius" />轨道半径</span><span><i className="dynamic-circle-legend-dot critical" />边界临界半径</span></div></div>
}
