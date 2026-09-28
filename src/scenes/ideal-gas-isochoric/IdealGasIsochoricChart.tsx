import { buildIsochoricTraceSegment, type IsochoricAxis, type VolumePreset, VOLUME_PRESETS, IDEAL_GAS_CONSTANTS, ISOCHORIC_TEMPERATURE_RANGE } from './model'
import type { IdealGasIsochoricSceneState } from './useIdealGasIsochoricSceneState'

type Props = { state: IdealGasIsochoricSceneState }
const WIDTH = 420
const HEIGHT = 220
const PAD = { left: 48, right: 24, top: 24, bottom: 40 }
const MAX_PRESSURE = 4.8
const COLORS: Record<VolumePreset, { line: string; label: string }> = { small: { line: '#c96c77', label: 'V₁' }, medium: { line: '#4f9b92', label: 'V₂' }, large: { line: '#457b9d', label: 'V₃' } }

function IsochoricPlot({ state, axis }: { state: IdealGasIsochoricSceneState; axis: IsochoricAxis }) {
  const absoluteZero = IDEAL_GAS_CONSTANTS.absoluteZeroC
  const xMin = axis === 'kelvin' ? 0 : absoluteZero
  const xMax = axis === 'kelvin' ? ISOCHORIC_TEMPERATURE_RANGE.maxK : ISOCHORIC_TEMPERATURE_RANGE.maxK + absoluteZero
  const measuredMin = axis === 'kelvin' ? ISOCHORIC_TEMPERATURE_RANGE.minK : ISOCHORIC_TEMPERATURE_RANGE.minK + absoluteZero
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const plotX = (x: number) => PAD.left + (x - xMin) / (xMax - xMin) * innerWidth
  const plotY = (p: number) => PAD.top + (1 - p / MAX_PRESSURE) * innerHeight
  const traces = (Object.entries(VOLUME_PRESETS) as Array<[VolumePreset, (typeof VOLUME_PRESETS)[VolumePreset]]>).map(([key, item]) => ({
    key,
    solid: buildIsochoricTraceSegment(item.volumeL, axis, measuredMin, xMax, 81).map(([x, p]) => `${plotX(x)},${plotY(p)}`).join(' '),
    extrapolation: buildIsochoricTraceSegment(item.volumeL, axis, xMin, measuredMin, 25).map(([x, p]) => `${plotX(x)},${plotY(p)}`).join(' '),
  }))
  const currentXValue = axis === 'kelvin' ? state.temperatureK : state.readings.celsius
  const currentX = plotX(currentXValue)
  const currentY = plotY(state.readings.pressureAtm)
  const currentLabelAtRight = currentX > WIDTH - PAD.right - 42
  return <svg className="ideal-gas-isochoric-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={axis === 'kelvin' ? '压强与热力学温度图像' : '压强与摄氏温度图像'}>
    <g className="ideal-gas-isochoric-grid">
      {Array.from({ length: 5 }, (_, index) => {
        const fraction = index / 4
        const x = xMin + (xMax - xMin) * fraction
        const p = MAX_PRESSURE * fraction
        return <g key={index}>
          <line x1={plotX(x)} x2={plotX(x)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={plotY(p)} y2={plotY(p)} />
          <text x={PAD.left - 7} y={plotY(p) + 3} textAnchor="end">{p === 0 ? '0' : p.toFixed(1)}</text>
          <text x={plotX(x)} y={HEIGHT - PAD.bottom + 13} textAnchor="middle">{Math.round(x)}</text>
        </g>
      })}
    </g>
    <line className="ideal-gas-isochoric-axis" x1={PAD.left} y1={plotY(0)} x2={WIDTH - PAD.right} y2={plotY(0)} />
    {axis === 'kelvin'
      ? <line className="ideal-gas-isochoric-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} />
      : <line className="ideal-gas-isochoric-zero" x1={plotX(absoluteZero)} x2={plotX(absoluteZero)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />}
    {traces.map(({ key, solid, extrapolation }) => <g key={key}>
      <polyline className={`ideal-gas-isochoric-curve volume-${key} ${key === state.volumePreset ? 'selected' : ''}`} points={solid} />
      <polyline className={`ideal-gas-isochoric-extrapolation volume-${key} ${key === state.volumePreset ? 'selected' : ''}`} points={extrapolation} />
    </g>)}
    <line className="ideal-gas-isochoric-tracker" x1={currentX} x2={currentX} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
    <circle className="ideal-gas-isochoric-point" cx={currentX} cy={currentY} r="5" />
    <text x={currentLabelAtRight ? currentX - 6 : currentX + 6} y={currentY - 8} textAnchor={currentLabelAtRight ? 'end' : 'start'} className="ideal-gas-isochoric-current-label">{state.readings.pressureAtm.toFixed(2)}</text>
    <text x={PAD.left} y="15">p / atm</text>
    <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end">{axis === 'kelvin' ? 'T / K' : 't / °C'}</text>
    {axis === 'celsius' && <text x={PAD.left + 4} y={PAD.top + 11} className="ideal-gas-isochoric-zero-label">0 K</text>}
    {traces.map(({ key }) => {
      const endPressure = buildIsochoricTraceSegment(VOLUME_PRESETS[key].volumeL, axis, xMax, xMax, 2)[1][1]
      return <text key={`label-${key}`} x={WIDTH - PAD.right + 4} y={plotY(endPressure) + 4} className={`ideal-gas-isochoric-line-label volume-${key} ${key === state.volumePreset ? 'selected' : ''}`}>{COLORS[key].label}</text>
    })}
  </svg>
}

export function IdealGasIsochoricChart({ state }: Props) {
  return <div className="ideal-gas-isochoric-chart-shell">
    <div className="ideal-gas-isochoric-chart-heading"><h3>等容线图像联动</h3><span>{state.running ? '分子热运动中' : '已暂停'} · n 固定，p/T = nR/V</span></div>
    <div className="ideal-gas-isochoric-chart-grid">
      <div><h4>p–T 图像（热力学温度）</h4><IsochoricPlot state={state} axis="kelvin" /></div>
      <div><h4>p–t 图像（摄氏温度）</h4><IsochoricPlot state={state} axis="celsius" /></div>
    </div>
    <div className="ideal-gas-isochoric-chart-legend">
      <span><i className="ideal-gas-isochoric-legend-dot v1" />V₁ = 2.0 L</span>
      <span><i className="ideal-gas-isochoric-legend-dot v2" />V₂ = 3.0 L</span>
      <span><i className="ideal-gas-isochoric-legend-dot v3" />V₃ = 6.0 L</span>
      <span className="ideal-gas-isochoric-legend-note">实线：100–420 K；虚线：外推至 0 K（−273.15 °C）</span>
    </div>
  </div>
}
