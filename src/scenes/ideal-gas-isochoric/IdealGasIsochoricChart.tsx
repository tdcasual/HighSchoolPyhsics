import { buildIsochoricTrace, type IsochoricAxis, type VolumePreset, VOLUME_PRESETS } from './model'
import type { IdealGasIsochoricSceneState } from './useIdealGasIsochoricSceneState'

type Props = { state: IdealGasIsochoricSceneState }
const WIDTH = 420
const HEIGHT = 220
const PAD = { left: 42, right: 22, top: 22, bottom: 34 }
const COLORS: Record<VolumePreset, { line: string; label: string }> = { small: { line: '#f8b4b9', label: 'V₁' }, medium: { line: '#b6ddd8', label: 'V₂' }, large: { line: '#457b9d', label: 'V₃' } }

function IsochoricPlot({ state, axis }: { state: IdealGasIsochoricSceneState; axis: IsochoricAxis }) {
  const xMin = axis === 'kelvin' ? 0 : -340
  const xMax = axis === 'kelvin' ? 420 : 200
  const maxPressure = 1.55
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (x: number) => PAD.left + (x - xMin) / (xMax - xMin) * innerWidth
  const plotY = (p: number) => PAD.top + (1 - p / maxPressure) * innerHeight
  const traces = (Object.entries(VOLUME_PRESETS) as Array<[VolumePreset, (typeof VOLUME_PRESETS)[VolumePreset]]>).map(([key, item]) => ({ key, points: buildIsochoricTrace(item.volumeL, axis, 81).map(([x, p]) => `${plotX(x)},${plotY(p)}`).join(' ') }))
  const currentXValue = axis === 'kelvin' ? state.temperatureK : state.readings.celsius
  const currentX = plotX(currentXValue)
  const currentY = plotY(state.readings.pressureAtm)
  const absoluteZeroX = plotX(-273.15)
  return <svg className="ideal-gas-isochoric-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={axis === 'kelvin' ? '压强与热力学温度图像' : '压强与摄氏温度图像'}>
    <g className="ideal-gas-isochoric-grid">{Array.from({ length: 5 }, (_, index) => <line key={`h-${index}`} x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + index * innerHeight / 4} y2={PAD.top + index * innerHeight / 4} />)}{Array.from({ length: 5 }, (_, index) => <line key={`v-${index}`} x1={PAD.left + index * innerWidth / 4} x2={PAD.left + index * innerWidth / 4} y1={PAD.top} y2={HEIGHT - PAD.bottom} />)}</g>
    <line className="ideal-gas-isochoric-axis" x1={PAD.left} y1={plotY(0)} x2={WIDTH - PAD.right} y2={plotY(0)} /><line className="ideal-gas-isochoric-axis" x1={axis === 'kelvin' ? PAD.left : absoluteZeroX} y1={PAD.top} x2={axis === 'kelvin' ? PAD.left : absoluteZeroX} y2={HEIGHT - PAD.bottom} />
    {traces.map(({ key, points }) => <polyline key={key} className={`ideal-gas-isochoric-curve ${key === state.volumePreset ? 'selected' : ''}`} points={points} />)}
    {axis === 'celsius' && <line className="ideal-gas-isochoric-zero" x1={absoluteZeroX} x2={absoluteZeroX} y1={PAD.top} y2={HEIGHT - PAD.bottom} />}
    <line className="ideal-gas-isochoric-tracker" x1={currentX} x2={currentX} y1={PAD.top} y2={HEIGHT - PAD.bottom} /><circle className="ideal-gas-isochoric-point" cx={currentX} cy={currentY} r="5" />
    <text x={PAD.left} y="14">p / atm</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">{axis === 'kelvin' ? 'T / K' : 't / °C'}</text><text x={PAD.left - 5} y={plotY(0) + 4} textAnchor="end">0</text><text x={currentX + 6} y={currentY - 8} className="ideal-gas-isochoric-current-label">{state.readings.pressureAtm.toFixed(2)}</text>{axis === 'celsius' && <text x={absoluteZeroX + 3} y={HEIGHT - PAD.bottom + 18} className="ideal-gas-isochoric-zero-label">−273.15</text>}
    {traces.map(({ key }) => <text key={`label-${key}`} x={WIDTH - PAD.right + 5} y={plotY(buildIsochoricTrace(VOLUME_PRESETS[key].volumeL, axis, 81).at(-1)?.[1] ?? 0) + 4} className={`ideal-gas-isochoric-line-label ${key === state.volumePreset ? 'selected' : ''}`}>{COLORS[key].label}</text>)}
  </svg>
}

export function IdealGasIsochoricChart({ state }: Props) {
  return <div className="ideal-gas-isochoric-chart-shell"><div className="ideal-gas-isochoric-chart-heading"><h3>等容线图像联动</h3><span>{state.running ? '分子热运动中' : '已暂停'} · p/T = nR/V</span></div><div className="ideal-gas-isochoric-chart-grid"><div><h4>p - T 图像（热力学温度）</h4><IsochoricPlot state={state} axis="kelvin" /></div><div><h4>p - t 图像（摄氏温度）</h4><IsochoricPlot state={state} axis="celsius" /></div></div><div className="ideal-gas-isochoric-chart-legend"><span><i className="ideal-gas-isochoric-legend-dot v1" />V₁ = 2.0 L</span><span><i className="ideal-gas-isochoric-legend-dot v2" />V₂ = 3.0 L</span><span><i className="ideal-gas-isochoric-legend-dot v3" />V₃ = 6.0 L</span><span className="ideal-gas-isochoric-legend-note">虚线延长线收束于绝对零度</span></div></div>
}
