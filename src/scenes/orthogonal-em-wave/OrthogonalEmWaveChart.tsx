import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Cursor, Dot, Label, Series } from '../../ui/charts/ChartFrame'
import { buildFieldTrace, PROBE_X, WAVE_LENGTH } from './model'
import type { OrthogonalEmWaveSceneState } from './useOrthogonalEmWaveSceneState'

export function OrthogonalEmWaveChart({ state }: { state: OrthogonalEmWaveSceneState }) {
  const params = { amplitude: state.amplitude, wavelength: state.wavelength, speed: state.speed, direction: state.direction }
  const trace = buildFieldTrace(state.elapsed, params, 97)
  const a = state.amplitude
  return (
    <ChartCard
      title="空间场分布 E(x)、B(x)"
      status={<>{state.running ? '传播中' : '已暂停'} · t={state.elapsed.toFixed(2)} s</>}
      legend={[
        { label: 'E 电场', color: 'var(--chart-2)' },
        { label: 'B 磁场', color: 'var(--chart-1)' },
        { label: '探针位置', color: 'var(--control-accent)', shape: 'dash' },
      ]}
    >
      <ChartFrame
        ariaLabel="电磁波电场与磁场空间分布图"
        xDomain={[0, WAVE_LENGTH]}
        yDomain={[-a * 1.1, a * 1.1]}
        yTicks={[{ value: a, label: '+A' }, { value: 0, label: '0' }, { value: -a, label: '−A' }]}
        xLabel="x / m"
        yLabel="E、B（相对值）"
      >
        {(plot) => (
          <>
            <Series plot={plot} points={trace.map(([x, e]) => [x, e] as const)} color="var(--chart-2)" />
            <Series plot={plot} points={trace.map(([x, , b]) => [x, b] as const)} color="var(--chart-1)" />
            <Cursor plot={plot} x={PROBE_X} />
            <Dot plot={plot} x={PROBE_X} y={state.readings.probe.e} color="var(--chart-2)" ring />
            <Label plot={plot} x={PROBE_X} y={state.readings.probe.e} dx={7} dy={-8}>x={PROBE_X} m</Label>
          </>
        )}
      </ChartFrame>
    </ChartCard>
  )
}
