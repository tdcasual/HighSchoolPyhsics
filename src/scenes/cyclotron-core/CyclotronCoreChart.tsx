import { useMemo } from 'react'
import { buildEnergyTrace, MAX_CROSSINGS } from './model'
import type { CyclotronCoreSceneState } from './useCyclotronCoreSceneState'

type Props = { state: CyclotronCoreSceneState }
const WIDTH = 440
const HEIGHT = 250
const PAD = { left: 52, right: 20, top: 26, bottom: 40 }
const CROSSING_TICKS = [0, 6, 12, 18, 24, 30, MAX_CROSSINGS]

export function CyclotronCoreChart({ state }: Props) {
  const trace = useMemo(
    () => buildEnergyTrace(state.particleType, state.B, state.U, MAX_CROSSINGS + 1),
    [state.particleType, state.B, state.U],
  )
  const maxEnergy = Math.max(1, state.readings.maxEnergy)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (crossings: number) => PAD.left + crossings / MAX_CROSSINGS * innerWidth
  const plotY = (energy: number) => HEIGHT - PAD.bottom - Math.min(energy, maxEnergy) / maxEnergy * innerHeight
  const points = trace.map(([crossings, energy]) => `${plotX(crossings)},${plotY(energy)}`).join(' ')
  const currentX = plotX(state.readings.accelerationCount)
  const currentY = plotY(state.readings.energy)
  const maxY = plotY(state.readings.maxEnergy)
  const energyTicks = Array.from({ length: 6 }, (_, index) => maxEnergy * index / 5)
  const status = state.readings.extracted ? '已射出' : state.running ? '加速中' : '已暂停'

  return (
    <div className="cyclotron-core-chart-shell">
      <div className="cyclotron-core-chart-heading">
        <h3>动能增长与最大动能</h3>
        <span>{status} · ΔE = qU</span>
      </div>
      <svg className="cyclotron-core-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="回旋加速器粒子动能增长图">
        <g className="cyclotron-core-grid">
          {CROSSING_TICKS.map((crossings) => (
            <line key={`v-${crossings}`} x1={plotX(crossings)} x2={plotX(crossings)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
          ))}
          {energyTicks.map((energy, index) => (
            <line key={`h-${index}`} x1={PAD.left} x2={WIDTH - PAD.right} y1={plotY(energy)} y2={plotY(energy)} />
          ))}
        </g>
        <line className="cyclotron-core-axis" x1={PAD.left} y1={HEIGHT - PAD.bottom} x2={WIDTH - PAD.right} y2={HEIGHT - PAD.bottom} />
        <line className="cyclotron-core-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} />
        <polyline className="cyclotron-core-energy-curve" points={points} />
        <line className="cyclotron-core-max-line" x1={PAD.left} x2={WIDTH - PAD.right} y1={maxY} y2={maxY} />
        <line className="cyclotron-core-tracker" x1={currentX} x2={currentX} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
        <circle className="cyclotron-core-energy-point" cx={currentX} cy={currentY} r="5" />
        {energyTicks.map((energy, index) => (
          <text key={`ey-${index}`} x={PAD.left - 7} y={plotY(energy) + 3} textAnchor="end">{energy.toFixed(0)}</text>
        ))}
        {CROSSING_TICKS.map((crossings) => (
          <text key={`ex-${crossings}`} x={plotX(crossings)} y={HEIGHT - PAD.bottom + 16} textAnchor="middle">{crossings}</text>
        ))}
        <text x={PAD.left} y="15">Eₖ / keV</text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 5} textAnchor="end">n / 次跨缝</text>
        <text className="cyclotron-core-max-label" x={WIDTH - PAD.right - 4} y={maxY - 5} textAnchor="end">Eₖ,max={state.readings.maxEnergy.toFixed(0)} keV</text>
      </svg>
      <div className="cyclotron-core-chart-legend">
        <span><i className="cyclotron-core-legend-dot energy" />当前粒子动能</span>
        <span><i className="cyclotron-core-legend-dot max" />装置最大动能</span>
      </div>
    </div>
  )
}
