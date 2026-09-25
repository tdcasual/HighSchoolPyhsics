import type { SpeedPoint } from './model'
import { DURATION } from './model'
import type { CartRun } from './state'
import { runFit } from './state'

const COLORS = ['#8c9a90', '#4d9ac7', '#6aa35f', '#c18a55', '#c0564a', '#8a5fb8']

export function CartChart({
  points,
  runs,
  group,
  selected,
}: {
  points: SpeedPoint[]
  runs: CartRun[]
  group: number
  selected: number | null
}) {
  const width = 640
  const height = 220
  const pad = { left: 42, right: 16, top: 24, bottom: 28 }
  const maxV = Math.max(0.2, ...points.map((point) => point.v), ...runs.map((run) => run.v0 + run.a * DURATION))
  const mapX = (time: number) => pad.left + (time / DURATION) * (width - pad.left - pad.right)
  const mapY = (speed: number) => height - pad.bottom - (speed / maxV) * (height - pad.top - pad.bottom)
  return (
    <svg className="cart-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="小车 v-t 图像">
      <rect width={width} height={height} rx="12" fill="#f7fbfb" />
      <text x="16" y="18" fontSize="14" fontWeight="700" fill="#24525c">v-t 图像，斜率是加速度</text>
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} stroke="#8aa0a6" />
      <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} stroke="#8aa0a6" />
      {runs.map((run) => {
        const fitted = runFit(run, group)
        if (!fitted) return null
        return (
          <line
            key={`${run.hooks}-${run.v0}-${run.dh}`}
            x1={mapX(0)}
            y1={mapY(fitted.v0)}
            x2={mapX(DURATION)}
            y2={mapY(fitted.v0 + fitted.a * DURATION)}
            stroke={COLORS[run.hooks] ?? '#888'}
            strokeWidth="1.5"
          />
        )
      })}
      {points.map((point) => (
        <circle key={point.index} data-testid={point.index === selected ? 'selected-speed' : undefined} cx={mapX(point.t)} cy={mapY(point.v)} r={point.index === selected ? 5 : 3.5} fill="#c17a48" />
      ))}
      <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="12" fill="#4d646c">t / s</text>
    </svg>
  )
}
