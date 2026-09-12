import { buildFieldTrace, PROBE_X, WAVE_LENGTH } from './model'
import type { OrthogonalEmWaveSceneState } from './useOrthogonalEmWaveSceneState'

type Props = { state: OrthogonalEmWaveSceneState }
const WIDTH = 420
const HEIGHT = 220
const PAD = { left: 40, right: 18, top: 22, bottom: 30 }

export function OrthogonalEmWaveChart({ state }: Props) {
  const params = { amplitude: state.amplitude, wavelength: state.wavelength, speed: state.speed, direction: state.direction }
  const trace = buildFieldTrace(state.elapsed, params, 97)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (x: number) => PAD.left + x / WAVE_LENGTH * innerWidth
  const plotY = (value: number) => PAD.top + (1 - (value + state.amplitude) / Math.max(0.001, state.amplitude * 2)) * innerHeight
  const ePoints = trace.map(([x, e]) => String(plotX(x)) + ',' + String(plotY(e))).join(' ')
  const bPoints = trace.map(([x, , b]) => String(plotX(x)) + ',' + String(plotY(b))).join(' ')
  const currentX = plotX(PROBE_X)
  const probeY = plotY(state.readings.probe.e)
  return <div className="orthogonal-em-wave-chart-shell"><div className="orthogonal-em-wave-chart-heading"><h3>空间场分布 E(x)、B(x)</h3><span>{state.running ? '传播中' : '已暂停'} · t={state.elapsed.toFixed(2)} s</span></div><svg className="orthogonal-em-wave-chart" viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT} role="img" aria-label="电磁波电场与磁场空间分布图"><g className="orthogonal-em-wave-grid">{Array.from({ length: 5 }, (_, index) => <line key={'h-' + index} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * innerHeight / 4} y2={PAD.top + index * innerHeight / 4} />)}{Array.from({ length: 5 }, (_, index) => <line key={'v-' + index} x1={PAD.left + index * innerWidth / 4} x2={PAD.left + index * innerWidth / 4} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}</g><line className="orthogonal-em-wave-axis" x1={PAD.left} y1={plotY(0)} x2={WIDTH - PAD.right} y2={plotY(0)} /><line className="orthogonal-em-wave-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} /><polyline className="orthogonal-em-wave-e-curve" points={ePoints} /><polyline className="orthogonal-em-wave-b-curve" points={bPoints} /><line className="orthogonal-em-wave-tracker" x1={currentX} x2={currentX} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><circle className="orthogonal-em-wave-probe" cx={currentX} cy={probeY} r="5" /><text x={PAD.left} y="14">E₀、B₀ / a.u.</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">x / m</text><text x={PAD.left - 4} y={PAD.top + 4} textAnchor="end">+A</text><text x={PAD.left - 4} y={plotY(0) + 4} textAnchor="end">0</text><text x={PAD.left - 4} y={HEIGHT - PAD.bottom + 4} textAnchor="end">−A</text><text x={currentX + 5} y={probeY - 7} className="orthogonal-em-wave-current-label">x=4 m</text></svg><div className="orthogonal-em-wave-chart-legend"><span><i className="orthogonal-em-wave-legend-dot e" />E 电场</span><span><i className="orthogonal-em-wave-legend-dot b" />B 磁场</span><span><i className="orthogonal-em-wave-legend-dot tracker" />探针位置</span></div></div>
}
