import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Cursor, Dot, Label, Segment, Series } from '../../ui/charts/ChartFrame'
import { buildProbeTrace } from './model'
import type { WaveStateSceneState } from './useWaveStateSceneState'

export function WaveStateChart({ state }: { state: WaveStateSceneState }) {
  const params = { amplitude: state.amplitude, wavelength: state.wavelength, period: state.period, direction: state.direction, startDirection: state.startDirection }
  const trace = buildProbeTrace(params, 97, state.probeX)
  const endTime = trace[trace.length - 1]?.[0] ?? state.period
  const arrival = state.readings.probeArrivalTime
  const markerTime = state.elapsed < arrival ? state.elapsed : arrival + ((state.elapsed - arrival) % state.period)
  const currentY = state.readings.probe.y
  const a = state.amplitude
  return (
    <ChartCard
      title="P 点位移—时间图像"
      status={<>波前到达后开始简谐振动 · tₐ={arrival.toFixed(2)} s</>}
      legend={[
        { label: 'P 点简谐振动', color: 'var(--chart-1)' },
        { label: '当前时刻', color: 'var(--control-accent)', shape: 'dash' },
        { label: '波前到达', color: 'var(--chart-6)', shape: 'dash' },
      ]}
    >
      <ChartFrame
        ariaLabel="简谐横波 P 点位移时间图"
        xDomain={[0, endTime]}
        yDomain={[-a * 1.1, a * 1.1]}
        yTicks={[{ value: a, label: '+A' }, { value: 0, label: '0' }, { value: -a, label: '−A' }]}
        xLabel="t / s"
        yLabel="yₚ / cm"
      >
        {(plot) => (
          <>
            <Series plot={plot} points={trace} color="var(--chart-1)" />
            {arrival > 0 ? (
              <>
                <Segment plot={plot} from={[arrival, -a * 1.1]} to={[arrival, a * 1.1]} color="var(--chart-6)" dashed strokeWidth={1.4} />
                <Label plot={plot} x={arrival} y={a * 1.1} dx={4} dy={14}>波前到达</Label>
              </>
            ) : null}
            <Cursor plot={plot} x={markerTime} />
            <Dot plot={plot} x={markerTime} y={currentY} color="var(--chart-point)" ring />
            <Label plot={plot} x={endTime} y={currentY} dx={-4} dy={-8} anchor="end">P={currentY.toFixed(1)} cm</Label>
          </>
        )}
      </ChartFrame>
    </ChartCard>
  )
}
