import { buildProbeTrace } from './model'
import type { WaveStateSceneState } from './useWaveStateSceneState'

type Props = { state: WaveStateSceneState }
const WIDTH = 420
const HEIGHT = 210
const PAD = { left: 40, right: 18, top: 20, bottom: 30 }

export function WaveStateChart({ state }: Props) {
  const params = { amplitude: state.amplitude, wavelength: state.wavelength, period: state.period, direction: state.direction }
  const trace = buildProbeTrace(params, 97)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (time: number) => PAD.left + time / state.period * innerWidth
  const plotY = (value: number) => PAD.top + (1 - (value + state.amplitude) / Math.max(0.001, state.amplitude * 2)) * innerHeight
  const points = trace.map(([time, y]) => `${plotX(time)},${plotY(y)}`).join(' ')
  const currentTime = state.elapsed % state.period
  const currentY = state.readings.probe.y
  const currentX = plotX(currentTime)
  return <div className="wave-state-chart-shell">
    <div className="wave-state-chart-heading"><h3>P 点位移—时间图像</h3><span>{state.running ? '传播中' : '已暂停'} · yₚ(t)</span></div>
    <svg className="wave-state-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="简谐横波 P 点位移时间图">
      <g className="wave-state-grid">{Array.from({ length: 5 }, (_, index) => <line key={`h-${index}`} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * innerHeight / 4} y2={PAD.top + index * innerHeight / 4} />)}{Array.from({ length: 5 }, (_, index) => <line key={`v-${index}`} x1={PAD.left + index * innerWidth / 4} x2={PAD.left + index * innerWidth / 4} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}</g>
      <line className="wave-state-axis" x1={PAD.left} y1={plotY(0)} x2={WIDTH - PAD.right} y2={plotY(0)} /><line className="wave-state-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} />
      <polyline className="wave-state-probe-curve" points={points} /><line className="wave-state-tracker" x1={currentX} x2={currentX} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><circle className="wave-state-probe-point" cx={currentX} cy={plotY(currentY)} r="5" />
      <text x={PAD.left} y="13">yₚ / cm</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">t / s</text><text x={PAD.left - 4} y={PAD.top + 4} textAnchor="end">+A</text><text x={PAD.left - 4} y={plotY(0) + 4} textAnchor="end">0</text><text x={PAD.left - 4} y={HEIGHT - PAD.bottom + 4} textAnchor="end">−A</text><text x={WIDTH - PAD.right} y={plotY(currentY) - 6} textAnchor="end" className="wave-state-current-label">P={currentY.toFixed(1)} cm</text>
    </svg>
    <div className="wave-state-chart-legend"><span><i className="wave-state-legend-dot probe" />P 点简谐振动</span><span><i className="wave-state-legend-dot tracker" />当前时刻</span></div>
  </div>
}
