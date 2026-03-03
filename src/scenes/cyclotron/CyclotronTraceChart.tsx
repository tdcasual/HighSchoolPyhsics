import { useMemo } from 'react'
import type { TimeSample } from './trace'

const CHART_WIDTH = 320
const CHART_HEIGHT = 180

type CyclotronTraceChartProps = {
  title: string
  series: TimeSample[]
  running: boolean
  valueLabel: string
  unit: string
  tone: 'voltage' | 'energy'
  fixedRange?: [number, number]
}

function safeSpan(minValue: number, maxValue: number): [number, number] {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return [-1, 1]
  }

  if (minValue === maxValue) {
    const pad = Math.abs(minValue) > 0 ? Math.abs(minValue) * 0.2 : 1
    return [minValue - pad, maxValue + pad]
  }

  const span = maxValue - minValue
  return [minValue - span * 0.1, maxValue + span * 0.1]
}

export function CyclotronTraceChart({
  title,
  series,
  running,
  valueLabel,
  unit,
  tone,
  fixedRange,
}: CyclotronTraceChartProps) {
  const plot = useMemo(() => {
    if (series.length === 0) {
      return {
        polyline: '',
        yRange: [-1, 1] as [number, number],
        startTimeS: 0,
        endTimeS: 1,
      }
    }

    const startTimeS = series[0]?.timeS ?? 0
    const endTimeS = series[series.length - 1]?.timeS ?? startTimeS + 1
    const xSpan = Math.max(1e-18, endTimeS - startTimeS)

    const values = series.map((sample) => sample.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const yRange = fixedRange ?? safeSpan(minValue, maxValue)
    const ySpan = Math.max(1e-30, yRange[1] - yRange[0])

    const polyline = series
      .map((sample) => {
        const x = ((sample.timeS - startTimeS) / xSpan) * CHART_WIDTH
        const y = ((yRange[1] - sample.value) / ySpan) * CHART_HEIGHT
        return `${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')

    return { polyline, yRange, startTimeS, endTimeS }
  }, [fixedRange, series])

  const latest = series[series.length - 1]

  return (
    <div className={`cyclotron-plot-card ${tone}`} data-presentation-signal="chart time-series">
      <h3>{title}</h3>
      <div className="cyclotron-plot-screen">
        <svg
          className="cyclotron-plot-svg"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          aria-label={title}
        >
          <g className="cyclotron-plot-grid">
            {Array.from({ length: 9 }).map((_, index) => {
              const x = (CHART_WIDTH / 8) * index
              return <line key={`grid-x-${title}-${x}`} x1={x} y1={0} x2={x} y2={CHART_HEIGHT} />
            })}
            {Array.from({ length: 7 }).map((_, index) => {
              const y = (CHART_HEIGHT / 6) * index
              return <line key={`grid-y-${title}-${y}`} x1={0} y1={y} x2={CHART_WIDTH} y2={y} />
            })}
          </g>
          <line className="cyclotron-plot-axis" x1={0} y1={CHART_HEIGHT / 2} x2={CHART_WIDTH} y2={CHART_HEIGHT / 2} />
          <line className="cyclotron-plot-axis" x1={0} y1={0} x2={0} y2={CHART_HEIGHT} />
          {plot.polyline.length > 0 ? (
            <polyline
              className={`cyclotron-plot-line ${tone === 'voltage' ? 'voltage-line' : 'energy-line'}`}
              points={plot.polyline}
            />
          ) : null}
        </svg>
      </div>
      <p className="cyclotron-plot-status">
        {running ? '运行中' : '已暂停'} · {valueLabel}: {latest ? latest.value.toExponential(2) : '0.00e+0'} {unit}
      </p>
      <p className="cyclotron-plot-status">
        t窗口: {plot.startTimeS.toExponential(2)} ~ {plot.endTimeS.toExponential(2)} s
      </p>
    </div>
  )
}
