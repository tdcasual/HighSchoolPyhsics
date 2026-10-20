import { memo } from 'react'
import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Label, Series } from '../../ui/charts/ChartFrame'
import type { Observer } from './model'

type Props = {
  observer: Observer | null
  maxAmp: number
  maxHistory: number
}

const S1 = 'var(--chart-2)'
const S2 = 'var(--chart-1)'
const COMBINED = 'var(--control-ink)'

/** y–t at the observation point: the two component waves dashed, their sum solid. */
export const WaveInterferenceChart = memo(function WaveInterferenceChart({ observer, maxAmp, maxHistory }: Props) {
  const range = Math.max(maxAmp * 1.2, 0.01)
  const count = observer
    ? Math.min(observer.history.length, observer.history1.length, observer.history2.length, observer.historyTimes.length, maxHistory)
    : 0
  const times = observer?.historyTimes ?? []
  const start = times[0] ?? 0
  const end = count >= 2 ? times[count - 1] : start + 1
  const series = (values: number[]) => Array.from({ length: count }, (_, index) => [times[index], values[index]] as const)
  return (
    <ChartCard
      title="观察点位移—时间图像（y-t）"
      legend={[
        { label: 'S₁ 分波', color: S1, shape: 'dash' },
        { label: 'S₂ 分波', color: S2, shape: 'dash' },
        { label: '合位移', color: COMBINED },
      ]}
    >
      <ChartFrame
        ariaLabel="观察点位移时间图像"
        xDomain={[start, end > start ? end : start + 1]}
        yDomain={[-range, range]}
        yTicks={[range, 0, -range]}
        formatY={(value) => (value === 0 ? '0' : (value > 0 ? '+' : '−') + Math.abs(value).toFixed(2))}
        formatX={(value) => value.toFixed(1)}
        xLabel="t / s"
        yLabel="y / m"
        height={200}
      >
        {(plot) =>
          observer && count >= 2 ? (
            <>
              <Series plot={plot} points={series(observer.history1)} color={S1} dashed strokeWidth={1.5} />
              <Series plot={plot} points={series(observer.history2)} color={S2} dashed strokeWidth={1.5} />
              <Series plot={plot} points={series(observer.history)} color={COMBINED} strokeWidth={2.6} />
            </>
          ) : (
            <Label plot={plot} x={(start + end) / 2} y={0} dy={-8} anchor="middle">等待观察点数据…</Label>
          )
        }
      </ChartFrame>
    </ChartCard>
  )
})
