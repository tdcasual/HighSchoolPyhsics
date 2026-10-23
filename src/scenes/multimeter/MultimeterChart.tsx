import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Dot, Series } from '../../ui/charts/ChartFrame'
import { rheostat, trialContact, voltAmmeter } from './model'
import { needleRotation } from './pose'

const RX_MIN = 10 ** -0.2
const RX_MAX = 10 ** 4.6
const SWEEP = (48 * Math.PI) / 180

/** The meter face enlarged: an arc of 10 divisions and the needle at `fraction` of full scale. */
export function ReadingChart({ fraction, caption }: { fraction: number; caption: string }) {
  const clamped = Math.max(-0.035, Math.min(1.04, fraction))
  const at = (theta: number, radius: number) => [180 + Math.cos(theta) * radius, 210 + Math.sin(theta) * radius]
  const angle = -Math.PI / 2 + (clamped - 0.5) * 2 * SWEEP
  const start = -Math.PI / 2 - SWEEP
  const end = -Math.PI / 2 + SWEEP
  const [needleX, needleY] = at(angle, 120)
  const [arcX0, arcY0] = at(start, 120)
  const [arcX1, arcY1] = at(end, 120)
  return (
    <ChartCard
      title={caption}
      footer={
        <>
          偏转 {fraction.toFixed(3)} · 转角 {((needleRotation(fraction) * 180) / Math.PI).toFixed(1)}°
        </>
      }
    >
      <svg className="multimeter-reading-chart" viewBox="0 0 360 230" role="img" aria-label="多用电表读数">
        <path
          d={`M ${arcX0} ${arcY0} A 120 120 0 0 1 ${arcX1} ${arcY1}`}
          fill="none"
          stroke="var(--control-ink)"
          strokeWidth="2.5"
        />
        {Array.from({ length: 11 }, (_, index) => {
          const theta = start + ((end - start) * index) / 10
          const major = index % 2 === 0
          const [x1, y1] = at(theta, 120)
          const [x2, y2] = at(theta, major ? 105 : 112)
          const [tx, ty] = at(theta, 91)
          return (
            <g key={index}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--control-ink)" strokeWidth={major ? 1.5 : 0.8} />
              {major ? (
                <text className="chart-tick" x={tx} y={ty + 4} textAnchor="middle">
                  {index}
                </text>
              ) : null}
            </g>
          )
        })}
        <line
          data-testid="chart-needle"
          x1="180"
          y1="210"
          x2={needleX}
          y2={needleY}
          stroke="var(--chart-2)"
          strokeWidth="3"
        />
        <circle cx="180" cy="210" r="4" fill="var(--control-ink)" />
      </svg>
    </ChartCard>
  )
}

/** Relative error of the external and internal connections against Rx (log scale). */
export function VoltAmmeterChart({
  lgRx,
  ammeterResistance,
  voltmeterResistance,
  method = 'external',
}: {
  lgRx: number
  ammeterResistance: number
  voltmeterResistance: number
  method?: 'external' | 'internal'
}) {
  const circuit = (Rx: number) => voltAmmeter({ Rx, RA: ammeterResistance, RV: voltmeterResistance, E: 3, Rs: 10 })
  const samples = Array.from({ length: 49 }, (_, index) => {
    const rx = 10 ** (-0.2 + (index * 4.8) / 48)
    const result = circuit(rx)
    return {
      rx,
      external: Math.min(80, Math.abs(result.external.error) * 100),
      internal: Math.min(80, Math.abs(result.internal.error) * 100),
    }
  })
  const rx = 10 ** lgRx
  const current = circuit(rx)
  const trial = trialContact({ Rx: rx, RA: ammeterResistance, RV: voltmeterResistance, E: 3, Rs: 10 })
  const selectedColor = method === 'external' ? 'var(--chart-1)' : 'var(--chart-2)'
  return (
    <ChartCard
      title="内外接法相对误差"
      status={trial.reason}
      legend={[
        { label: '外接法', color: 'var(--chart-1)' },
        { label: '内接法', color: 'var(--chart-2)' },
      ]}
      footer={
        <>
          外接 {current.external.R.toFixed(2)} Ω · 内接 {current.internal.R.toFixed(2)} Ω · 临界值{' '}
          {current.critical.toFixed(1)} Ω
        </>
      }
    >
      <ChartFrame
        ariaLabel="内外接误差"
        xScale="log"
        xDomain={[RX_MIN, RX_MAX]}
        yDomain={[0, 80]}
        xTicks={[1, 10, 100, 1000, 10000]}
        yTicks={[0, 20, 40, 60, 80]}
        formatY={(value) => `${value}%`}
        xLabel="Rx / Ω（对数刻度）"
        yLabel="相对误差"
      >
        {(plot) => (
          <>
            <Series
              plot={plot}
              points={samples.map((sample) => [sample.rx, sample.external] as const)}
              color="var(--chart-1)"
            />
            <Series
              plot={plot}
              points={samples.map((sample) => [sample.rx, sample.internal] as const)}
              color="var(--chart-2)"
            />
            <Dot
              plot={plot}
              x={rx}
              y={Math.min(80, Math.abs(current.external.error) * 100)}
              color="var(--chart-1)"
              r={4}
              testId="external-point"
            />
            <Dot
              plot={plot}
              x={rx}
              y={Math.min(80, Math.abs(current[method].error) * 100)}
              color={selectedColor}
              r={6}
              ring
              testId="selected-point"
            />
          </>
        )}
      </ChartFrame>
    </ChartCard>
  )
}

/** Load voltage against the slider position for the current-limiting and divider circuits. */
export function RheostatChart({
  slider,
  load,
  rheostatResistance,
  mode = 'divider',
  closed = true,
}: {
  slider: number
  load: number
  rheostatResistance: number
  mode?: 'limit' | 'divider'
  closed?: boolean
}) {
  const circuit = (s: number) => rheostat({ E: 3, r: 0.5, R0: rheostatResistance, Rx: load, s })
  const samples = Array.from({ length: 21 }, (_, index) => {
    const result = circuit(index / 20)
    return { position: index / 20, limit: result.limit.U, divider: result.divider.U }
  })
  const now = circuit(slider)
  return (
    <ChartCard
      title="限流与分压输出电压"
      status={
        <>
          {closed ? '已闭合' : '开关断开'} · 当前{mode === 'limit' ? '限流' : '分压'}{' '}
          {closed ? now[mode].U.toFixed(2) : '0.00'} V
        </>
      }
      legend={[
        { label: '限流接法', color: 'var(--chart-1)' },
        { label: '分压接法', color: 'var(--chart-2)' },
      ]}
      footer={
        <>
          限流范围 {now.limitRange[0].toFixed(2)}–{now.limitRange[1].toFixed(2)} V · 分压范围 0–
          {now.dividerRange[1].toFixed(2)} V
        </>
      }
    >
      <ChartFrame
        ariaLabel="限流与分压"
        xDomain={[0, 1]}
        yDomain={[0, 3]}
        xTicks={[0, 0.25, 0.5, 0.75, 1]}
        yTicks={[0, 1, 2, 3]}
        formatX={(value) => value.toFixed(2)}
        xLabel="滑片位置 s（离 a 端比例）"
        yLabel="U / V"
      >
        {(plot) => (
          <>
            <Series
              plot={plot}
              points={samples.map((sample) => [sample.position, sample.limit] as const)}
              color="var(--chart-1)"
            />
            <Series
              plot={plot}
              points={samples.map((sample) => [sample.position, sample.divider] as const)}
              color="var(--chart-2)"
            />
            <Dot
              plot={plot}
              x={slider}
              y={closed ? now[mode].U : 0}
              color={mode === 'limit' ? 'var(--chart-1)' : 'var(--chart-2)'}
              ring
              testId="rheostat-point"
            />
          </>
        )}
      </ChartFrame>
    </ChartCard>
  )
}
