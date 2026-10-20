import { useMemo } from 'react'
import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Cursor, Dot, Series } from '../../ui/charts/ChartFrame'
import { buildPhaseTrace, emfToPlotPoint, phaseToPlotPoint } from './model'

/** θ from 0 to 2π, plotted on the model's −1…1 phase axis. */
const PHASE_TICKS = [
  { value: -1, label: '0' },
  { value: -0.5, label: 'π/2' },
  { value: 0, label: 'π' },
  { value: 0.5, label: '3π/2' },
  { value: 1, label: '2π' },
]

export function GeneratorCoreChart({ angleRad, running }: { angleRad: number; running: boolean }) {
  const trace = useMemo(() => buildPhaseTrace(240), [])
  const [phaseX, flux] = phaseToPlotPoint(angleRad)
  const [, emf] = emfToPlotPoint(angleRad)
  return (
    <ChartCard
      title="磁通量与感应电动势"
      status={<>{running ? '旋转中' : '已暂停'} · θ 同步追踪</>}
      legend={[
        { label: 'Φ/Φₘ = cosθ', color: 'var(--chart-1)' },
        { label: 'e/Eₘ = sinθ', color: 'var(--chart-2)' },
      ]}
    >
      <ChartFrame
        ariaLabel="发电机磁通量和感应电动势相位图"
        xDomain={[-1, 1]}
        yDomain={[-1.1, 1.1]}
        xTicks={PHASE_TICKS}
        yTicks={[{ value: 1, label: '+1' }, 0, { value: -1, label: '−1' }]}
        xLabel="θ"
        yLabel="e, Φ"
        testId="generator-core-chart"
      >
        {(plot) => (
          <>
            <Series plot={plot} points={trace.flux} color="var(--chart-1)" />
            <Series plot={plot} points={trace.emf} color="var(--chart-2)" />
            <Cursor plot={plot} x={phaseX} />
            <Dot plot={plot} x={phaseX} y={flux} color="var(--chart-1)" ring />
            <Dot plot={plot} x={phaseX} y={emf} color="var(--chart-2)" ring />
          </>
        )}
      </ChartFrame>
    </ChartCard>
  )
}
