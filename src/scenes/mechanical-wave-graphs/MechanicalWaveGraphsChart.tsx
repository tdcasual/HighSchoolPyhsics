import { buildTemporalWave, TIME_LENGTH } from './model'
import type { MechanicalWaveGraphsSceneState } from './useMechanicalWaveGraphsSceneState'

type Props = { state: MechanicalWaveGraphsSceneState }
const WIDTH = 420
const HEIGHT = 210
const PAD = { left: 40, right: 18, top: 20, bottom: 30 }

export function MechanicalWaveGraphsChart({ state }: Props) {
  const trace = buildTemporalWave({ amplitude: state.amplitude, wavelength: state.wavelength, period: state.period, probeX: state.probeX }, 97)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (time: number) => PAD.left + time / TIME_LENGTH * innerWidth
  const plotY = (value: number) => PAD.top + (1 - (value + state.amplitude) / Math.max(0.001, state.amplitude * 2)) * innerHeight
  const points = trace.map(([time, y]) => String(plotX(time)) + ',' + String(plotY(y))).join(' ')
  const currentTime = Math.min(TIME_LENGTH, state.elapsed % TIME_LENGTH)
  const currentX = plotX(currentTime)
  return <div className="mechanical-wave-graphs-chart-shell"><div className="mechanical-wave-graphs-chart-heading"><h3>P 点振动 y-t 图像</h3><span>{state.running ? '传播中' : '已暂停'} · yₚ(t)</span></div><svg className="mechanical-wave-graphs-chart" viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT} role="img" aria-label="机械波选中质点振动图"><g className="mechanical-wave-graphs-grid">{Array.from({ length: 5 }, (_, index) => <line key={'h-' + index} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * innerHeight / 4} y2={PAD.top + index * innerHeight / 4} />)}{Array.from({ length: 5 }, (_, index) => <line key={'v-' + index} x1={PAD.left + index * innerWidth / 4} x2={PAD.left + index * innerWidth / 4} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}</g><line className="mechanical-wave-graphs-axis" x1={PAD.left} y1={plotY(0)} x2={WIDTH - PAD.right} y2={plotY(0)} /><line className="mechanical-wave-graphs-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} /><polyline className="mechanical-wave-graphs-curve" points={points} /><line className="mechanical-wave-graphs-tracker" x1={currentX} x2={currentX} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><circle className="mechanical-wave-graphs-point" cx={currentX} cy={plotY(state.readings.displacement)} r="5" /><text x={PAD.left} y="13">y / cm</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">t / s</text><text x={currentX + 5} y={plotY(state.readings.displacement) - 7} className="mechanical-wave-graphs-current-label">{state.readings.displacement.toFixed(1)} cm</text></svg><div className="mechanical-wave-graphs-legend"><span><i className="mechanical-wave-graphs-legend-dot curve" />质点振动曲线</span><span><i className="mechanical-wave-graphs-legend-dot tracker" />当前时刻</span></div></div>
}
