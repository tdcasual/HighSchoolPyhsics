import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Series } from '../../ui/charts/ChartFrame'
import { niceMax } from '../../ui/charts/scale'
import { CHART_SAMPLE_INTERVAL, MAX_CHART_POINTS } from './model'

const MAGNET = 'var(--chart-2)'
const FRAME = 'var(--chart-1)'

const indexed = (values: number[]) => values.map((value, index) => [index, value] as const)

/** Magnet and aluminium-frame angular speeds over the latest samples (newest on the right). */
export function ElectromagneticDriveChart({ magnetSpeeds, frameSpeeds }: { magnetSpeeds: number[]; frameSpeeds: number[] }) {
  const maxValue = niceMax(Math.max(5, ...magnetSpeeds, ...frameSpeeds))
  const samples = Math.max(magnetSpeeds.length, frameSpeeds.length)
  return (
    <ChartCard
      title="实时角速度对比"
      ariaLabel="实时角速度对比图"
      legend={[
        { label: '磁铁转速', color: MAGNET },
        { label: '铝框转速', color: FRAME },
      ]}
      footer={<>横轴：采样先后（每 {CHART_SAMPLE_INTERVAL} 步采样，最多 {MAX_CHART_POINTS} 点，右端最新）</>}
    >
      <ChartFrame
        ariaLabel="角速度对比图，纵轴单位 rad/s，横轴从较早采样到最新采样"
        xDomain={[0, Math.max(1, samples - 1)]}
        yDomain={[0, maxValue]}
        xTicks={[]}
        yLabel="ω / (rad·s⁻¹)"
        xLabel="采样 →"
        height={220}
      >
        {(plot) => (
          <>
            <Series plot={plot} points={indexed(magnetSpeeds)} color={MAGNET} strokeWidth={3} area />
            <Series plot={plot} points={indexed(frameSpeeds)} color={FRAME} strokeWidth={3} area />
          </>
        )}
      </ChartFrame>
    </ChartCard>
  )
}
