import { buildEmfTrace } from './model'
import type { FaradayDiscSceneState } from './useFaradayDiscSceneState'

type Props = { state: FaradayDiscSceneState }
const WIDTH = 420
const HEIGHT = 210
const PAD = { left: 44, right: 18, top: 20, bottom: 30 }

export function FaradayDiscChart({ state }: Props) {
  const trace = buildEmfTrace({ B: state.B, omega: state.omega, radius: state.radius, externalResistance: state.externalResistance, rotation: state.rotation, magnetic: state.magnetic, circuit: state.circuit }, 81)
  const maxOmega = trace[trace.length - 1][0]
  const maxEmf = Math.max(...trace.map(([, emf]) => Math.abs(emf)), 0.01)
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (omega: number) => PAD.left + omega / maxOmega * innerWidth
  const plotY = (emf: number) => PAD.top + (1 - (emf + maxEmf) / (2 * maxEmf)) * innerHeight
  const points = trace.map(([omega, emf]) => String(plotX(omega)) + ',' + String(plotY(emf))).join(' ')
  const currentX = plotX(state.omega)
  const currentY = plotY(state.readings.emf)
  return <div className="faraday-disc-chart-shell"><div className="faraday-disc-chart-heading"><h3>感应电动势与角速度</h3><span>{state.running ? '转动中' : '已暂停'} · E=½BωR²</span></div><svg className="faraday-disc-chart" viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT} role="img" aria-label="法拉第圆盘感应电动势角速度图"><g className="faraday-disc-grid">{Array.from({ length: 5 }, (_, index) => <line key={'h-' + index} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * innerHeight / 4} y2={PAD.top + index * innerHeight / 4} />)}{Array.from({ length: 5 }, (_, index) => <line key={'v-' + index} x1={PAD.left + index * innerWidth / 4} x2={PAD.left + index * innerWidth / 4} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}</g><line className="faraday-disc-axis" x1={PAD.left} y1={plotY(0)} x2={WIDTH - PAD.right} y2={plotY(0)} /><line className="faraday-disc-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} /><polyline className="faraday-disc-emf-curve" points={points} /><line className="faraday-disc-tracker" x1={currentX} x2={currentX} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><circle className="faraday-disc-point" cx={currentX} cy={currentY} r="5" /><text x={PAD.left} y="13">E / V</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">ω / rad·s⁻¹</text><text x={currentX + 5} y={currentY - 7} className="faraday-disc-current-label">{state.readings.emf.toFixed(3)} V</text></svg><div className="faraday-disc-chart-legend"><span><i className="faraday-disc-legend-dot emf" />感应电动势 E</span><span><i className="faraday-disc-legend-dot tracker" />当前角速度</span></div></div>
}
