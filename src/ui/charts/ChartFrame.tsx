import { useId, type ReactNode, type SVGProps } from 'react'
import { usePredictionMasked } from '../notes/predictionContext'
import { niceTicks, scale, tickFormatter, tickLabel, tickValue, type Domain, type Tick } from './scale'

export type Padding = { left: number; right: number; top: number; bottom: number }

/** Data → SVG coordinates for one plot, handed to the marks drawn inside a ChartFrame. */
export type Plot = {
  x: (value: number) => number
  y: (value: number) => number
  left: number
  right: number
  top: number
  bottom: number
  /** SVG path through the points (M … L …); NaN points break the line. */
  path: (points: ReadonlyArray<readonly [number, number]>) => string
}

export const CHART_WIDTH = 440
const DEFAULT_PAD: Padding = { left: 52, right: 16, top: 22, bottom: 38 }

type ChartFrameProps = {
  ariaLabel: string
  xDomain: Domain
  yDomain: Domain
  xScale?: 'linear' | 'log'
  /** Ticks to draw; defaults to nice linear ticks. Pass [] for none. */
  xTicks?: Tick[]
  yTicks?: Tick[]
  formatX?: (value: number) => string
  formatY?: (value: number) => string
  xLabel?: ReactNode
  yLabel?: ReactNode
  /** Small heading above this plot (when a ChartCard holds several). */
  title?: ReactNode
  height?: number
  width?: number
  pad?: Partial<Padding>
  /** Draw y = 0 as an axis when the y domain crosses it (default true). */
  zeroAxis?: boolean
  /** Clip marks to the plot area (default true). */
  clip?: boolean
  className?: string
  testId?: string
  children?: (plot: Plot) => ReactNode
}

/** Axes, grid, ticks and labels for an x–y plot in classroom-sized type; marks go in children. */
export function ChartFrame({
  ariaLabel,
  xDomain,
  yDomain,
  xScale = 'linear',
  xTicks,
  yTicks,
  formatX,
  formatY,
  xLabel,
  yLabel,
  title,
  height = 240,
  width = CHART_WIDTH,
  pad: padOverride,
  zeroAxis = true,
  clip = true,
  className,
  testId,
  children,
}: ChartFrameProps) {
  const clipId = useId()
  const pad = { ...DEFAULT_PAD, ...padOverride }
  const left = pad.left
  const right = width - pad.right
  const top = pad.top
  const bottom = height - pad.bottom
  const x = scale(xDomain, [left, right], xScale)
  const y = scale(yDomain, [bottom, top])
  const plot: Plot = {
    x,
    y,
    left,
    right,
    top,
    bottom,
    path: (points) => {
      let d = ''
      let pen = false
      for (const [px, py] of points) {
        if (!Number.isFinite(px) || !Number.isFinite(py)) {
          pen = false
          continue
        }
        d += `${pen ? 'L' : 'M'}${x(px).toFixed(1)} ${y(py).toFixed(1)} `
        pen = true
      }
      return d.trim()
    },
  }
  const resolvedXTicks = xTicks ?? (xScale === 'log' ? [] : niceTicks(xDomain))
  const resolvedYTicks = yTicks ?? niceTicks(yDomain)
  const xFormat = formatX ?? tickFormatter(resolvedXTicks.map(tickValue))
  const yFormat = formatY ?? tickFormatter(resolvedYTicks.map(tickValue))
  const showZero = zeroAxis && yDomain[0] < 0 && yDomain[1] > 0
  const svg = (
    <svg
      className={['chart-frame', className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={top - 2} width={right - left} height={bottom - top + 4} />
        </clipPath>
      </defs>
      {resolvedXTicks.map((tick) => {
        const px = x(tickValue(tick))
        return (
          <g key={`x${tickValue(tick)}`}>
            <line className="chart-grid" x1={px} x2={px} y1={top} y2={bottom} />
            <text className="chart-tick" x={px} y={bottom + 17} textAnchor="middle">
              {tickLabel(tick, xFormat)}
            </text>
          </g>
        )
      })}
      {resolvedYTicks.map((tick) => {
        const py = y(tickValue(tick))
        return (
          <g key={`y${tickValue(tick)}`}>
            <line className="chart-grid" x1={left} x2={right} y1={py} y2={py} />
            <text className="chart-tick" x={left - 6} y={py + 4} textAnchor="end">
              {tickLabel(tick, yFormat)}
            </text>
          </g>
        )
      })}
      <line className="chart-axis" x1={left} x2={left} y1={top} y2={bottom} />
      <line className="chart-axis" x1={left} x2={right} y1={bottom} y2={bottom} />
      {showZero ? <line className="chart-axis" x1={left} x2={right} y1={y(0)} y2={y(0)} /> : null}
      <g clipPath={clip ? `url(#${clipId})` : undefined}>{children?.(plot)}</g>
      {xLabel ? (
        <text className="chart-axis-label" x={right} y={height - 5} textAnchor="end">
          {xLabel}
        </text>
      ) : null}
      {yLabel ? (
        <text className="chart-axis-label" x={left + 6} y={top - 8}>
          {yLabel}
        </text>
      ) : null}
    </svg>
  )
  if (!title) return svg
  return (
    <div className="chart-frame-block">
      <h4 className="chart-frame-title">{title}</h4>
      {svg}
    </div>
  )
}

type Answerable = {
  /** A conclusion the class should predict: hidden while prediction mode masks answers. */
  answer?: boolean
}

function useHidden(answer: boolean | undefined): boolean {
  const masked = usePredictionMasked()
  return Boolean(answer && masked)
}

/** A curve through data points; `area` fills down to the bottom of the plot. */
export function Series({
  plot,
  points,
  color,
  dashed,
  strokeWidth = 2.6,
  area,
  testId,
  className,
  answer,
}: Answerable & {
  plot: Plot
  points: ReadonlyArray<readonly [number, number]>
  color: string
  dashed?: boolean
  strokeWidth?: number
  area?: boolean
  testId?: string
  className?: string
}) {
  if (useHidden(answer) || points.length === 0) return null
  const d = plot.path(points)
  const finite = points.filter(([px, py]) => Number.isFinite(px) && Number.isFinite(py))
  return (
    <g className={className} data-testid={testId}>
      {area && finite.length > 1 ? (
        <path
          className="chart-area"
          d={`${d} L${plot.x(finite[finite.length - 1][0]).toFixed(1)} ${plot.bottom} L${plot.x(finite[0][0]).toFixed(1)} ${plot.bottom} Z`}
          fill={color}
        />
      ) : null}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dashed ? '6 5' : undefined}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  )
}

/** The vertical "now" line at x. */
export function Cursor({ plot, x, label }: { plot: Plot; x: number; label?: ReactNode }) {
  const px = plot.x(x)
  return (
    <g className="chart-cursor">
      <line x1={px} x2={px} y1={plot.top} y2={plot.bottom} />
      {label ? (
        <text x={px + 4} y={plot.top + 12}>
          {label}
        </text>
      ) : null}
    </g>
  )
}

/** A point at (x, y): the current reading, a measurement, a selected sample. */
export function Dot({
  plot,
  x,
  y,
  color,
  r = 5,
  ring,
  testId,
  answer,
  ...rest
}: Answerable & {
  plot: Plot
  x: number
  y: number
  color: string
  r?: number
  /** White outline so the point stands out on a curve of the same colour. */
  ring?: boolean
  testId?: string
} & Omit<SVGProps<SVGCircleElement>, 'x' | 'y' | 'r' | 'color'>) {
  if (useHidden(answer)) return null
  return (
    <circle
      {...rest}
      data-testid={testId}
      cx={plot.x(x)}
      cy={plot.y(y)}
      r={r}
      fill={color}
      className={ring ? 'chart-dot-ring' : rest.className}
    />
  )
}

/** A straight line between two data points: fits, secants, tangents, slope triangles. */
export function Segment({
  plot,
  from,
  to,
  color,
  dashed,
  strokeWidth = 2,
  testId,
  answer,
  children,
}: Answerable & {
  plot: Plot
  from: readonly [number, number]
  to: readonly [number, number]
  color: string
  dashed?: boolean | string
  strokeWidth?: number
  testId?: string
  /** e.g. a <title> tooltip. */
  children?: ReactNode
}) {
  if (useHidden(answer)) return null
  return (
    <path
      data-testid={testId}
      d={`M${plot.x(from[0]).toFixed(1)} ${plot.y(from[1]).toFixed(1)} L${plot.x(to[0]).toFixed(1)} ${plot.y(to[1]).toFixed(1)}`}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dashed === true ? '6 4' : dashed || undefined}
      fill="none"
    >
      {children}
    </path>
  )
}

/** Text placed at a data point, offset in pixels. */
export function Label({
  plot,
  x,
  y,
  dx = 0,
  dy = 0,
  anchor = 'start',
  color,
  children,
}: {
  plot: Plot
  x: number
  y: number
  dx?: number
  dy?: number
  anchor?: 'start' | 'middle' | 'end'
  color?: string
  children: ReactNode
}) {
  return (
    <text
      className="chart-label"
      x={plot.x(x) + dx}
      y={plot.y(y) + dy}
      textAnchor={anchor}
      style={color ? { fill: color } : undefined}
    >
      {children}
    </text>
  )
}
