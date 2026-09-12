import { useMemo } from 'react'
import { buildEnergyTrace } from './model'
import type { CyclotronCoreSceneState } from './useCyclotronCoreSceneState'

type Props = { state: CyclotronCoreSceneState }
const WIDTH = 420
const HEIGHT = 220
const PAD = { left: 42, right: 18, top: 20, bottom: 30 }

export function CyclotronCoreChart({ state }: Props) {
  const trace = useMemo(() => buildEnergyTrace(state.particleType, state.B, state.U, 13), [state.particleType, state.B, state.U])
  const maxEnergy = Math.max(1, state.readings.maxEnergy)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (crossings: number) => PAD.left + crossings / 12 * innerWidth
  const plotY = (energy: number) => HEIGHT - PAD.bottom - Math.min(energy, maxEnergy) / maxEnergy * innerHeight
  const points = trace.map(([crossings, energy]) => `${plotX(crossings)},${plotY(energy)}`).join(' ')
  const currentX = plotX(state.readings.accelerationCount + state.readings.progress)
  const currentY = plotY(state.readings.energy)
  const maxY = plotY(state.readings.maxEnergy)
  return <div className="cyclotron-core-chart-shell">
    <div className="cyclotron-core-chart-heading"><h3>动能增长与最大动能</h3><span>{state.running ? '加速中' : '已暂停'} · ΔE = qU</span></div>
    <svg className="cyclotron-core-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="回旋加速器粒子动能增长图">
      <g className="cyclotron-core-grid">{Array.from({ length: 7 }, (_, index) => <line key={`v-${index}`} x1={PAD.left + index * innerWidth / 6} x2={PAD.left + index * innerWidth / 6} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}{Array.from({ length: 6 }, (_, index) => <line key={`h-${index}`} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * innerHeight / 5} y2={PAD.top + index * innerHeight / 5} />)}</g>
      <line className="cyclotron-core-axis" x1={PAD.left} y1={HEIGHT - PAD.bottom} x2={WIDTH - PAD.right} y2={HEIGHT - PAD.bottom} />
      <line className="cyclotron-core-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} />
      <polyline className="cyclotron-core-energy-curve" points={points} />
      <line className="cyclotron-core-max-line" x1={PAD.left} x2={WIDTH - PAD.right} y1={maxY} y2={maxY} />
      <line className="cyclotron-core-tracker" x1={currentX} x2={currentX} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
      <circle className="cyclotron-core-energy-point" cx={currentX} cy={currentY} r="5" />
      <text x={PAD.left} y="13">Eₖ / a.u.</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">加速次数 n</text>
      <text className="cyclotron-core-max-label" x={WIDTH - PAD.right - 4} y={maxY - 5} textAnchor="end">Eₖ,max={state.readings.maxEnergy.toFixed(0)}</text>
      <text x={PAD.left} y={HEIGHT - 8}>0</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">12</text>
    </svg>
    <div className="cyclotron-core-chart-legend"><span><i className="cyclotron-core-legend-dot energy" />当前粒子动能</span><span><i className="cyclotron-core-legend-dot max" />最大动能</span></div>
  </div>
}
