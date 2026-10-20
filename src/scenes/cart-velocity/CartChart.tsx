import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Dot, Label, Segment } from '../../ui/charts/ChartFrame'
import { niceMax } from '../../ui/charts/scale'
import { DURATION, fit, type SpeedPoint } from './model'
import type { CartRun } from './state'
import { runFit } from './state'

/** Earlier runs, coloured by the number of hook weights. */
const RUN_COLORS = ['var(--chart-6)', 'var(--chart-1)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-2)', 'var(--chart-4)']
const POINT = 'var(--chart-point)'
const FIT = 'var(--chart-3)'

export function CartChart({
  points,
  runs,
  group,
  selected,
  showFit,
  showSlopeTriangle,
  onSelectPoint,
}: {
  points: SpeedPoint[]
  runs: CartRun[]
  group: number
  selected: number | null
  showFit: boolean
  showSlopeTriangle: boolean
  onSelectPoint: (index: number) => void
}) {
  const fitted = fit(points)
  const maxV = niceMax(Math.max(
    0.2,
    ...points.map((point) => point.v),
    ...runs.map((run) => run.v0 + run.a * DURATION),
    fitted ? fitted.v0 + fitted.a * DURATION : 0,
  ))
  const first = points[0]
  const last = points[points.length - 1]
  const at = (time: number) => (fitted ? fitted.v0 + fitted.a * time : 0)
  return (
    <ChartCard
      title="v–t 图像：斜率表示加速度"
      legend={[
        { label: '测速点', color: POINT, shape: 'dot' },
        ...(showFit && fitted ? [{ label: '当前拟合', color: FIT }] : []),
        ...runs.map((run) => ({ label: `${run.hooks} 个钩码`, color: RUN_COLORS[run.hooks] ?? 'var(--chart-6)', shape: 'dash' as const })),
      ]}
    >
      <ChartFrame
        ariaLabel="小车 v-t 图像"
        xDomain={[0, DURATION]}
        yDomain={[0, maxV]}
        xTicks={Array.from({ length: 5 }, (_, index) => ({ value: (DURATION * index) / 4, label: ((DURATION * index) / 4).toFixed(1) }))}
        xLabel="t / s"
        yLabel="v / (m·s⁻¹)"
        clip={false}
      >
        {(plot) => (
          <>
            {runs.map((run) => {
              const line = runFit(run, group)
              if (!line) return null
              return <Segment key={`${run.hooks}-${run.v0}-${run.dh}`} plot={plot} from={[0, line.v0]} to={[DURATION, line.v0 + line.a * DURATION]} color={RUN_COLORS[run.hooks] ?? 'var(--chart-6)'} dashed="5 3" strokeWidth={1.5} />
            })}
            {showFit && fitted ? <Segment plot={plot} from={[0, fitted.v0]} to={[DURATION, at(DURATION)]} color={FIT} strokeWidth={2.5} testId="current-fit-line" /> : null}
            {showSlopeTriangle && fitted && first && last ? (
              <g data-testid="slope-triangle">
                <Segment plot={plot} from={[first.t, at(first.t)]} to={[last.t, at(first.t)]} color="var(--chart-5)" dashed="4 3" strokeWidth={1.5} />
                <Segment plot={plot} from={[last.t, at(first.t)]} to={[last.t, at(last.t)]} color="var(--chart-5)" dashed="4 3" strokeWidth={1.5} />
                <Label plot={plot} x={(first.t + last.t) / 2} y={at(first.t)} dy={-5} anchor="middle" color="var(--chart-5)">Δt</Label>
                <Label plot={plot} x={last.t} y={(at(first.t) + at(last.t)) / 2} dx={5} color="var(--chart-5)">Δv</Label>
              </g>
            ) : null}
            {points.map((point) => (
              <Dot
                key={point.index}
                plot={plot}
                x={point.t}
                y={point.v}
                r={point.index === selected ? 6 : 4}
                color={POINT}
                testId={point.index === selected ? 'selected-speed' : undefined}
                role="button"
                tabIndex={0}
                aria-label={'查看 ' + point.label + ' 点测速计算'}
                onClick={() => onSelectPoint(point.index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectPoint(point.index)
                  }
                }}
              />
            ))}
          </>
        )}
      </ChartFrame>
    </ChartCard>
  )
}
