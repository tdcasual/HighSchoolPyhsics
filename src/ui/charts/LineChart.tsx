import { useMemo } from 'react'

export type LineSeries = {
  id: string
  label: string
  color: string
  points: Array<[number, number]>
  dashed?: boolean
}

type LineChartProps = {
  title: string
  /** Accessible description of what is plotted. */
  ariaLabel: string
  xLabel: string
  yLabel: string
  series: LineSeries[]
  xDomain: [number, number]
  yDomain: [number, number]
  /** Vertical cursor at the current time. */
  cursorX?: number
}

const WIDTH = 440
const HEIGHT = 240
const PAD = { left: 52, right: 16, top: 18, bottom: 38 }

function ticks([min, max]: [number, number], count = 4): number[] {
  const span = max - min || 1
  const raw = span / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= raw) ?? raw
  const start = Math.ceil(min / step) * step
  const values: number[] = []
  for (let value = start; value <= max + step * 1e-6; value += step) values.push(Number(value.toFixed(10)))
  return values
}

function formatTick(value: number): string {
  return Math.abs(value) >= 100 || Number.isInteger(value) ? value.toFixed(0) : value.toFixed(Math.abs(value) < 1 ? 2 : 1)
}

/** Shared SVG line chart for scene x-t / v-t plots; text is sized for classroom projection. */
export function LineChart({ title, ariaLabel, xLabel, yLabel, series, xDomain, yDomain, cursorX }: LineChartProps) {
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const mapX = (x: number) => PAD.left + ((x - xDomain[0]) / (xDomain[1] - xDomain[0] || 1)) * innerWidth
  const mapY = (y: number) => PAD.top + (1 - (y - yDomain[0]) / (yDomain[1] - yDomain[0] || 1)) * innerHeight
  const xTicks = useMemo(() => ticks(xDomain), [xDomain])
  const yTicks = useMemo(() => ticks(yDomain), [yDomain])
  return (
    <figure className="line-chart">
      <figcaption className="line-chart-title">{title}</figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={ariaLabel}>
        {xTicks.map((x) => (
          <g key={`x${x}`}>
            <line className="line-chart-grid" x1={mapX(x)} x2={mapX(x)} y1={PAD.top} y2={PAD.top + innerHeight} />
            <text className="line-chart-tick" x={mapX(x)} y={PAD.top + innerHeight + 18} textAnchor="middle">{formatTick(x)}</text>
          </g>
        ))}
        {yTicks.map((y) => (
          <g key={`y${y}`}>
            <line className="line-chart-grid" x1={PAD.left} x2={PAD.left + innerWidth} y1={mapY(y)} y2={mapY(y)} />
            <text className="line-chart-tick" x={PAD.left - 6} y={mapY(y) + 4} textAnchor="end">{formatTick(y)}</text>
          </g>
        ))}
        {yDomain[0] < 0 && yDomain[1] > 0 ? (
          <line className="line-chart-axis" x1={PAD.left} x2={PAD.left + innerWidth} y1={mapY(0)} y2={mapY(0)} />
        ) : null}
        {series.map((line) => (
          <polyline
            key={line.id}
            fill="none"
            stroke={line.color}
            strokeWidth={2.6}
            strokeDasharray={line.dashed ? '6 5' : undefined}
            points={line.points.map(([x, y]) => `${mapX(x).toFixed(1)},${mapY(y).toFixed(1)}`).join(' ')}
          />
        ))}
        {cursorX !== undefined ? (
          <line className="line-chart-cursor" x1={mapX(cursorX)} x2={mapX(cursorX)} y1={PAD.top} y2={PAD.top + innerHeight} />
        ) : null}
        <text className="line-chart-axis-label" x={PAD.left + innerWidth} y={HEIGHT - 4} textAnchor="end">{xLabel}</text>
        <text className="line-chart-axis-label" x={8} y={PAD.top - 4}>{yLabel}</text>
      </svg>
      <div className="line-chart-legend">
        {series.map((line) => (
          <span key={line.id}><i style={{ background: line.color }} />{line.label}</span>
        ))}
      </div>
    </figure>
  )
}
