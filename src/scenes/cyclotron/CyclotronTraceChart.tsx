import { formatScientific } from '../../ui/formatNumber'
import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Series } from '../../ui/charts/ChartFrame'
import { paddedExtent } from '../../ui/charts/scale'
import type { TimeSample } from './trace'

type CyclotronTraceChartProps = {
  title: string
  series: TimeSample[]
  running: boolean
  valueLabel: string
  unit: string
  tone: 'voltage' | 'energy'
  fixedRange?: [number, number]
}

/** Grid lines across the time window; times are given in the footer (they are 10⁻⁸ s scale). */
const TIME_GRID = Array.from({ length: 9 }, (_, index) => ({ value: index / 8, label: '' }))

export function CyclotronTraceChart({
  title,
  series,
  running,
  valueLabel,
  unit,
  tone,
  fixedRange,
}: CyclotronTraceChartProps) {
  const start = series[0]?.timeS ?? 0
  const end = series[series.length - 1]?.timeS ?? start + 1
  const span = Math.max(1e-18, end - start)
  const yDomain = fixedRange ?? paddedExtent(series.map((sample) => sample.value))
  const latest = series[series.length - 1]
  return (
    <ChartCard
      title={title}
      status={
        <>
          {running ? '运行中' : '已暂停'} · {valueLabel} = {formatScientific(latest ? latest.value : 0)} {unit}
        </>
      }
      footer={
        <>
          t 窗口：{formatScientific(start)} ~ {formatScientific(end)} s
        </>
      }
    >
      <ChartFrame
        ariaLabel={title}
        xDomain={[0, 1]}
        yDomain={yDomain}
        xTicks={TIME_GRID}
        xLabel="t"
        yLabel={`${valueLabel} / ${unit}`}
        height={200}
      >
        {(plot) => (
          <Series
            plot={plot}
            points={series.map((sample) => [(sample.timeS - start) / span, sample.value] as const)}
            color={tone === 'voltage' ? 'var(--chart-2)' : 'var(--chart-1)'}
            strokeWidth={2.4}
          />
        )}
      </ChartFrame>
    </ChartCard>
  )
}
