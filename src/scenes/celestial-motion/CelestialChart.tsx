import { ChartCard } from '../../ui/charts/ChartCard'
import { ChartFrame, Dot, Series } from '../../ui/charts/ChartFrame'
import { craftsAt, groundPoint, SIDEREAL_DAY, type Scenario } from './model'

const DEG = 180 / Math.PI

export function CelestialChart({ scenario }: { scenario: Scenario }) {
  if (scenario.mode === 'synchronous') return <GroundTrack scenario={scenario} />
  return <PlaneChart scenario={scenario} />
}

function GroundTrack({ scenario }: { scenario: Scenario }) {
  // One sidereal day of the sub-satellite point; break the line where longitude wraps ±180°.
  const points: Array<[number, number]> = []
  let previous: number | null = null
  for (let index = 0; index <= 240; index += 1) {
    const point = groundPoint(scenario.inclination, scenario.phase, (SIDEREAL_DAY * index) / 240)
    const longitude = point.longitude * DEG
    if (previous !== null && Math.abs(longitude - previous) > 180) points.push([Number.NaN, Number.NaN])
    points.push([longitude, point.latitude * DEG])
    previous = longitude
  }
  const current = groundPoint(scenario.inclination, scenario.phase, scenario.time)
  return (
    <ChartCard title="星下点轨迹" status="地球固定坐标">
      <ChartFrame
        ariaLabel="星下点轨迹"
        xDomain={[-180, 180]}
        yDomain={[-60, 60]}
        xTicks={[-180, -90, 0, 90, 180]}
        yTicks={[-60, -30, 0, 30, 60]}
        xLabel="经度 / °"
        yLabel="纬度 / °"
      >
        {(plot) => (
          <>
            <Series plot={plot} points={points} color="var(--chart-2)" strokeWidth={2.2} />
            <Dot plot={plot} x={current.longitude * DEG} y={current.latitude * DEG} color="var(--chart-3)" ring testId="ground-point" />
          </>
        )}
      </ChartFrame>
    </ChartCard>
  )
}

/** The orbit plane seen face-on, in units of the body radius; a diagram, not a plot. */
function PlaneChart({ scenario }: { scenario: Scenario }) {
  const width = 440
  const height = 260
  const center = { x: 150, y: 130 }
  const reach = Math.max(scenario.q1, scenario.mode === 'circular' ? scenario.q1 : scenario.q2) * 1.15
  const unit = 108 / reach
  const map = (x: number, y: number) => [center.x + x * unit, center.y - y * unit]
  const pathOf = (points: number[][]) => points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' ')
  const loop = (radius: number) => Array.from({ length: 73 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 72
    return map(radius * Math.cos(angle), radius * Math.sin(angle))
  })
  const ellipse = () => {
    const semiMajor = scenario.semi / scenario.body.R
    const semiMinor = semiMajor * Math.sqrt(1 - scenario.eccentricity ** 2)
    return Array.from({ length: 73 }, (_, index) => {
      const anomaly = (Math.PI * 2 * index) / 72
      return map(semiMajor * (Math.cos(anomaly) - scenario.eccentricity), semiMinor * Math.sin(anomaly))
    })
  }
  const [originX, originY] = map(0, 0)
  const legend = scenario.mode === 'transfer'
    ? [{ label: '转移椭圆', color: 'var(--chart-2)' }]
    : [
        { label: scenario.mode === 'rendezvous' ? '内轨' : '轨道', color: 'var(--chart-3)' },
        ...(scenario.mode === 'rendezvous' ? [{ label: '外轨', color: 'var(--chart-1)' }] : []),
      ]
  return (
    <ChartCard title="轨道平面" status="焦点在中心天体" legend={legend}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="轨道平面图">
        <circle cx={originX} cy={originY} r={unit} fill={scenario.body.color} opacity="0.85" />
        {scenario.mode === 'transfer' ? (
          <path d={pathOf(ellipse())} fill="none" stroke="var(--chart-2)" strokeWidth="2" />
        ) : (
          <>
            <path d={pathOf(loop(scenario.q1))} fill="none" stroke="var(--chart-3)" strokeWidth="2" />
            {scenario.mode === 'rendezvous' ? <path d={pathOf(loop(scenario.q2))} fill="none" stroke="var(--chart-1)" strokeWidth="2" /> : null}
          </>
        )}
        {craftsAt(scenario).map((craft) => {
          const [x, y] = map(craft.plane.x, craft.plane.y)
          return <circle key={craft.id} cx={x} cy={y} r="5" fill={craft.color} />
        })}
        <g className="chart-tick">
          <text x="290" y="78">v = √(GM/r)</text>
          <text x="290" y="104">T = 2π√(r³/GM)</text>
          <text x="290" y="130">r³/T² = GM/4π²</text>
        </g>
        <text className="chart-label" x="290" y="168" style={{ fill: 'var(--chart-2)' }}>r 增大，v 减小，T 增大</text>
      </svg>
    </ChartCard>
  )
}
