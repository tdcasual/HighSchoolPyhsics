import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Dot, Label, Series } from '../../ui/charts/ChartFrame'
import { niceMax } from '../../ui/charts/scale'
import type { TapeDot, TapeSpeedSample } from './model'

type TickerTimerChartProps = {
  dots: TapeDot[]
  speedSeriesMps: TapeSpeedSample[]
  instantaneousSpeedMps: number | null
}

const SPEED = 'var(--chart-2)'

/** The paper tape drawn to scale: dots at their positions, smeared ones larger. */
function TapeStrip({ dots }: { dots: TapeDot[] }) {
  const maxPosition = Math.max(0.04, dots[dots.length - 1]?.positionM ?? 0)
  return (
    <div className="chart-frame-block">
      <h4 className="chart-frame-title">纸带点迹</h4>
      <svg viewBox="0 0 440 56" role="img" aria-label="纸带点迹，横向位置按位移比例显示">
        <rect x="16" y="18" width="408" height="20" rx="4" fill="var(--chart-bg)" stroke="var(--chart-6)" />
        {dots.map((dot, index) => (
          <circle key={index} cx={24 + (dot.positionM / maxPosition) * 392} cy={28} r={dot.smeared ? 3.4 : 2.2} fill={dot.smeared ? 'var(--chart-5)' : 'var(--control-ink)'} />
        ))}
      </svg>
    </div>
  )
}

export function TickerTimerChart({ dots, speedSeriesMps, instantaneousSpeedMps }: TickerTimerChartProps) {
  const timeMax = niceMax(Math.max(0.1, ...speedSeriesMps.map((sample) => sample.timeS)))
  const speedMax = niceMax(Math.max(0.1, ...speedSeriesMps.map((sample) => sample.speedMps)))
  return (
    <ChartCard
      title="纸带与 v–t 图像"
      status={instantaneousSpeedMps !== null ? <>当前 v = {instantaneousSpeedMps.toFixed(3)} m/s</> : null}
      legend={[{ label: '中间时刻速度（相邻两段平均）', color: SPEED, shape: 'dot' }]}
    >
      <TapeStrip dots={dots} />
      <ChartFrame
        title="v–t（中间时刻估算）"
        ariaLabel="速度-时间图，纵轴速度单位米每秒，横轴时间单位秒"
        xDomain={[0, timeMax]}
        yDomain={[0, speedMax]}
        xLabel="t / s"
        yLabel="v / (m·s⁻¹)"
        height={200}
      >
        {(plot) =>
          speedSeriesMps.length ? (
            <>
              <Series plot={plot} points={speedSeriesMps.map((sample) => [sample.timeS, sample.speedMps] as const)} color={SPEED} strokeWidth={2} />
              {speedSeriesMps.map((sample, index) => (
                <Dot key={index} plot={plot} x={sample.timeS} y={sample.speedMps} r={3} color={SPEED} data-time-s={sample.timeS} data-speed-mps={sample.speedMps} />
              ))}
            </>
          ) : (
            <Label plot={plot} x={timeMax / 2} y={speedMax / 2} anchor="middle">点数不足，释放纸带后绘制</Label>
          )
        }
      </ChartFrame>
    </ChartCard>
  )
}
