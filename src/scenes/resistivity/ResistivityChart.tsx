import { formatScientific } from '../../core/formatNumber'
import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Dot, Segment, Series } from '../../ui/charts/ChartFrame'
import { niceMax } from '../../ui/charts/scale'
import { differential, element, ELEMENTS, type ElementKind } from './model'

type Point = [number, number]

/** Measured points with the least-squares line through them (R–l, R–1/S, U–I …). */
export function ResistivityChart({
  title,
  points,
  slope,
  intercept,
  xLabel,
  yLabel,
}: {
  title: string
  points: Point[]
  slope: number | null
  intercept: number
  xLabel: string
  yLabel: string
}) {
  const xMax = niceMax(Math.max(0.05, ...points.map((point) => point[0])))
  const yMax = niceMax(Math.max(0.05, ...points.map((point) => point[1]), slope !== null ? slope * xMax + intercept : 0))
  return (
    <ChartCard
      title={title}
      legend={[
        { label: '测量点', color: 'var(--chart-point)', shape: 'dot' },
        ...(slope !== null ? [{ label: '拟合直线', color: 'var(--chart-1)' }] : []),
      ]}
    >
      <ChartFrame ariaLabel={title} xDomain={[0, xMax]} yDomain={[0, yMax]} xLabel={xLabel} yLabel={yLabel} height={230}>
        {(plot) => (
          <>
            {slope !== null ? <Segment plot={plot} from={[0, intercept]} to={[xMax, slope * xMax + intercept]} color="var(--chart-1)" testId="fit-line" /> : null}
            {points.map((point, index) => <Dot key={index} plot={plot} x={point[0]} y={point[1]} color="var(--chart-point)" r={4.5} />)}
          </>
        )}
      </ChartFrame>
    </ChartCard>
  )
}

/** The element's I–U characteristic with the secant (R = U/I) and tangent at the operating point. */
export function ElementChart({ kind, voltage, showSecant = true, showTangent = false }: { kind: ElementKind; voltage: number; showSecant?: boolean; showTangent?: boolean }) {
  const info = ELEMENTS[kind]
  const samples: Point[] = []
  for (let index = 0; index <= 48; index += 1) {
    const u = info.min + ((info.max - info.min) * index) / 48
    samples.push([u, element(kind, u).I])
  }
  const yMin = kind === 'diode' ? -0.002 : 0
  const now = element(kind, voltage)
  const slope = differential(kind, voltage)
  const reach = (info.max - info.min) * 0.18
  const u0 = Math.max(info.min, now.U - reach)
  const u1 = Math.min(info.max, now.U + reach)
  return (
    <ChartCard
      title={info.name}
      status={<>U = {now.U.toFixed(2)} V · I = {formatScientific(now.I)} A</>}
      legend={[
        { label: 'I–U 曲线', color: 'var(--chart-3)' },
        ...(showSecant ? [{ label: '割线：R = U/I', color: 'var(--chart-2)', shape: 'dash' as const }] : []),
        ...(showTangent ? [{ label: '切线：斜率 dI/dU', color: 'var(--chart-1)', shape: 'dash' as const }] : []),
      ]}
    >
      <ChartFrame
        ariaLabel="伏安特性曲线"
        xDomain={[info.min, info.max]}
        yDomain={[yMin, info.Imax]}
        formatX={(value) => value.toFixed(kind === 'diode' ? 1 : 2)}
        formatY={(value) => (value === 0 ? '0' : value.toPrecision(2))}
        xLabel="U / V"
        yLabel="I / A"
        pad={{ left: 62 }}
        height={230}
      >
        {(plot) => (
          <>
            <Series plot={plot} points={samples} color="var(--chart-3)" testId="iv-curve" />
            {showSecant && Math.abs(now.U) > 1e-9 ? (
              <Segment plot={plot} from={[0, 0]} to={[now.U, now.I]} color="var(--chart-2)" dashed testId="iv-secant">
                <title>割线：R = U/I</title>
              </Segment>
            ) : null}
            {showTangent ? (
              <Segment plot={plot} from={[u0, now.I + slope * (u0 - now.U)]} to={[u1, now.I + slope * (u1 - now.U)]} color="var(--chart-1)" dashed="3 3" testId="iv-tangent">
                <title>切线：斜率 dI/dU</title>
              </Segment>
            ) : null}
            <Dot plot={plot} x={now.U} y={now.I} color="var(--chart-point)" ring testId="iv-point" />
          </>
        )}
      </ChartFrame>
    </ChartCard>
  )
}
