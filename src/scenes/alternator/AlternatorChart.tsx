import { useMemo } from 'react'
import { MAX_CHART_POINTS } from './model'

type AlternatorChartProps = {
  voltageHistory: number[]
  currentVoltageV: number
  currentTimeLabel: string
  peakVoltageV: number
}

const VIEWBOX_WIDTH = 360
const VIEWBOX_HEIGHT = 220
const PADDING = {
  top: 20,
  right: 18,
  bottom: 26,
  left: 26,
}

function resolveMaxValue(peakVoltageV: number, voltageHistory: number[], currentVoltageV: number) {
  return Math.max(
    1,
    Math.abs(peakVoltageV),
    Math.abs(currentVoltageV),
    ...voltageHistory.map((value) => Math.abs(value)),
  )
}

function createLinePath(values: number[], maxValue: number) {
  if (values.length === 0) {
    return ''
  }

  const innerWidth = VIEWBOX_WIDTH - PADDING.left - PADDING.right
  const innerHeight = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom
  const centerY = PADDING.top + innerHeight / 2
  const stepX = innerWidth / Math.max(1, MAX_CHART_POINTS - 1)

  return values
    .map((value, index) => {
      const x = PADDING.left + stepX * index
      const y = centerY - (value / maxValue) * (innerHeight / 2)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

function resolveCurrentPoint(values: number[], currentVoltageV: number, maxValue: number) {
  const innerWidth = VIEWBOX_WIDTH - PADDING.left - PADDING.right
  const innerHeight = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom
  const centerY = PADDING.top + innerHeight / 2
  const stepX = innerWidth / Math.max(1, MAX_CHART_POINTS - 1)

  if (values.length === 0) {
    return {
      x: PADDING.left,
      y: centerY - (currentVoltageV / maxValue) * (innerHeight / 2),
    }
  }

  const lastIndex = values.length - 1
  const lastValue = values[lastIndex]

  return {
    x: PADDING.left + stepX * lastIndex,
    y: centerY - (lastValue / maxValue) * (innerHeight / 2),
  }
}

export function AlternatorChart({
  voltageHistory,
  currentVoltageV,
  currentTimeLabel,
  peakVoltageV,
}: AlternatorChartProps) {
  const maxValue = useMemo(
    () => resolveMaxValue(peakVoltageV, voltageHistory, currentVoltageV),
    [currentVoltageV, peakVoltageV, voltageHistory],
  )
  const linePath = useMemo(
    () => createLinePath(voltageHistory, maxValue),
    [maxValue, voltageHistory],
  )
  const currentPoint = useMemo(
    () => resolveCurrentPoint(voltageHistory, currentVoltageV, maxValue),
    [currentVoltageV, maxValue, voltageHistory],
  )
  const centerY = PADDING.top + (VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom) / 2

  return (
    <div className="alternator-chart-shell" aria-label="交流发电机 U-t 图">
      <div className="alternator-chart-title-row">
        <p className="alternator-chart-title">U-t 图</p>
        <p className="alternator-chart-time">当前时刻 {currentTimeLabel}</p>
      </div>

      <svg
        className="alternator-chart"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-label="交流发电机电压时间图"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = PADDING.top + (VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom) * ratio
          return (
            <line
              key={`grid-${ratio}`}
              x1={PADDING.left}
              y1={y}
              x2={VIEWBOX_WIDTH - PADDING.right}
              y2={y}
              stroke="var(--alternator-chart-grid-line)"
              strokeWidth="1"
            />
          )
        })}

        <line
          x1={PADDING.left}
          y1={centerY}
          x2={VIEWBOX_WIDTH - PADDING.right}
          y2={centerY}
          stroke="var(--alternator-chart-axis-line)"
          strokeWidth="1.6"
        />

        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="var(--alternator-chart-wave-line)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        <circle
          cx={currentPoint.x}
          cy={currentPoint.y}
          r="5"
          fill="var(--alternator-chart-current-point)"
        />

        <text x={PADDING.left} y={PADDING.top - 4} fill="var(--alternator-chart-axis-text)" fontSize="11">
          {maxValue.toFixed(2)} V
        </text>
        <text x={PADDING.left} y={centerY - 6} fill="var(--alternator-chart-axis-subtext)" fontSize="11">
          0
        </text>
        <text x={PADDING.left} y={VIEWBOX_HEIGHT - 6} fill="var(--alternator-chart-axis-subtext)" fontSize="11">
          {`${(-maxValue).toFixed(2)} V`}
        </text>
        <text
          x={VIEWBOX_WIDTH - PADDING.right - 6}
          y={VIEWBOX_HEIGHT - 6}
          fill="var(--alternator-chart-axis-subtext)"
          fontSize="11"
          textAnchor="end"
        >
          t
        </text>
      </svg>
    </div>
  )
}
