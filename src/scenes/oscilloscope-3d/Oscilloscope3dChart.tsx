import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Dot, Series } from '../../ui/charts/ChartFrame'

/** The screen's graticule: 10 × 8 divisions, unlabelled as on the instrument. */
const X_DIVISIONS = Array.from({ length: 11 }, (_, index) => ({ value: -1 + index / 5, label: '' }))
const Y_DIVISIONS = Array.from({ length: 9 }, (_, index) => ({ value: -1 + index / 4, label: '' }))

type Props = { trace: Array<[number, number]>; beam: [number, number]; running: boolean; mode: string }

export function Oscilloscope3dChart({ trace, beam, running, mode }: Props) {
  return (
    <ChartCard
      title="荧光屏波形"
      status={<>{running ? '扫描中' : '已暂停'} · {mode}</>}
      legend={[
        { label: 'Y 偏转/信号', color: 'var(--chart-3)' },
        { label: '光点', color: 'var(--chart-point)', shape: 'dot' },
      ]}
    >
      <ChartFrame
        ariaLabel="示波器荧光屏波形图"
        xDomain={[-1, 1]}
        yDomain={[-1, 1]}
        xTicks={X_DIVISIONS}
        yTicks={Y_DIVISIONS}
        height={330}
        pad={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        {(plot) => (
          <>
            <Series plot={plot} points={trace} color="var(--chart-3)" strokeWidth={3} />
            <Dot plot={plot} x={beam[0]} y={beam[1]} color="var(--chart-point)" r={5} ring />
          </>
        )}
      </ChartFrame>
    </ChartCard>
  )
}
