import { fit, type SpeedPoint } from './model'
import { DURATION } from './model'
import type { CartRun } from './state'
import { runFit } from './state'

const COLORS = ['#8c9a90', '#4d9ac7', '#6aa35f', '#c18a55', '#c0564a', '#8a5fb8']

function velocityStep(maximum: number): number {
  if (maximum <= 0.8) return 0.2
  if (maximum <= 2) return 0.5
  if (maximum <= 4) return 1
  if (maximum <= 8) return 2
  return 5
}

export function CartChart({
  points,
  runs,
  group,
  selected,
  showFit,
  showSlopeTriangle,
  onSelectPoint,
}: {
  points: SpeedPoint[]
  runs: CartRun[]
  group: number
  selected: number | null
  showFit: boolean
  showSlopeTriangle: boolean
  onSelectPoint: (index: number) => void
}) {
  const width = 640
  const height = 260
  const pad = { left: 54, right: 18, top: 28, bottom: 38 }
  const fitted = fit(points)
  const maxMeasured = Math.max(0.2, ...points.map((point) => point.v))
  const maxRun = Math.max(0, ...runs.map((run) => run.v0 + run.a * DURATION))
  const maxFit = fitted ? fitted.v0 + fitted.a * DURATION : 0
  const maxRaw = Math.max(maxMeasured, maxRun, maxFit)
  const yStep = velocityStep(maxRaw)
  const yDecimals = Number.isInteger(yStep) ? 0 : 1
  const maxV = Math.max(yStep, Math.ceil(maxRaw / yStep) * yStep)
  const mapX = (time: number) => pad.left + (time / DURATION) * (width - pad.left - pad.right)
  const mapY = (speed: number) => height - pad.bottom - (speed / maxV) * (height - pad.top - pad.bottom)
  const first = points[0]
  const last = points[points.length - 1]
  const firstFit = fitted && first ? fitted.v0 + fitted.a * first.t : null
  const lastFit = fitted && last ? fitted.v0 + fitted.a * last.t : null

  return (
    <div className="cart-chart-wrap">
    <svg className="cart-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="小车 v-t 图像">
      <rect width={width} height={height} rx="12" fill="#f7fbfb" />
      <text x="16" y="19" fontSize="14" fontWeight="700" fill="#24525c">v–t 图像：斜率表示加速度</text>
      {Array.from({ length: 5 }, (_, index) => {
        const time = DURATION * index / 4
        const x = mapX(time)
        return (
          <g key={`x-${index}`}>
            <line x1={x} y1={pad.top} x2={x} y2={height - pad.bottom} stroke="#dce7e8" />
            <text x={x} y={height - pad.bottom + 16} textAnchor="middle" fontSize="13" fill="#60777d">{time.toFixed(1)}</text>
          </g>
        )
      })}
      {Array.from({ length: Math.floor(maxV / yStep) + 1 }, (_, index) => {
        const speed = index * yStep
        const y = mapY(speed)
        return (
          <g key={`y-${index}`}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#dce7e8" />
            <text x={pad.left - 8} y={y + 3} textAnchor="end" fontSize="13" fill="#60777d">{speed.toFixed(yDecimals)}</text>
          </g>
        )
      })}
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} stroke="#8aa0a6" />
      <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} stroke="#8aa0a6" />
      <text x={width / 2} y={height - 7} textAnchor="middle" fontSize="14" fill="#4d646c">t / s</text>
      <text x="13" y={height / 2} textAnchor="middle" fontSize="14" fill="#4d646c" transform={`rotate(-90 13 ${height / 2})`}>v / (m·s⁻¹)</text>
      {runs.map((run) => {
        const line = runFit(run, group)
        if (!line) return null
        return (
          <line
            key={`${run.hooks}-${run.v0}-${run.dh}`}
            x1={mapX(0)}
            y1={mapY(line.v0)}
            x2={mapX(DURATION)}
            y2={mapY(line.v0 + line.a * DURATION)}
            stroke={COLORS[run.hooks] ?? '#888'}
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />
        )
      })}
      {showFit && fitted ? (
        <line
          data-testid="current-fit-line"
          x1={mapX(0)}
          y1={mapY(fitted.v0)}
          x2={mapX(DURATION)}
          y2={mapY(fitted.v0 + fitted.a * DURATION)}
          stroke="#176b78"
          strokeWidth="2.5"
        />
      ) : null}
      {showSlopeTriangle && fitted && first && last && firstFit !== null && lastFit !== null ? (
        <g className="cart-slope-triangle" data-testid="slope-triangle">
          <line x1={mapX(first.t)} y1={mapY(firstFit)} x2={mapX(last.t)} y2={mapY(firstFit)} stroke="#c17a48" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1={mapX(last.t)} y1={mapY(firstFit)} x2={mapX(last.t)} y2={mapY(lastFit)} stroke="#c17a48" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x={(mapX(first.t) + mapX(last.t)) / 2} y={mapY(firstFit) - 5} textAnchor="middle" fontSize="13" fill="#a86435">Δt</text>
          <text x={mapX(last.t) + 5} y={(mapY(firstFit) + mapY(lastFit)) / 2} fontSize="13" fill="#a86435">Δv</text>
        </g>
      ) : null}
      {points.map((point) => (
        <circle
          key={point.index}
          data-testid={point.index === selected ? 'selected-speed' : undefined}
          role="button"
          tabIndex={0}
          aria-label={'查看 ' + point.label + ' 点测速计算'}
          onClick={() => onSelectPoint(point.index)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onSelectPoint(point.index)
            }
          }}
          cx={mapX(point.t)}
          cy={mapY(point.v)}
          r={point.index === selected ? 5 : 3.5}
          fill="#c17a48"
        />
      ))}
    </svg>
    <div className="cart-chart-legend" aria-label="图表图例">
      <span><i style={{ backgroundColor: '#c17a48' }} />测速点</span>
      {showFit && fitted ? <span><i style={{ backgroundColor: '#176b78' }} />当前拟合</span> : null}
      {runs.map((run) => (
        <span key={run.hooks + ':' + run.v0 + ':' + run.dh}>
          <i style={{ backgroundColor: COLORS[run.hooks] ?? '#888' }} />
          {run.hooks} 个钩码
        </span>
      ))}
    </div>
    </div>
  )
}
