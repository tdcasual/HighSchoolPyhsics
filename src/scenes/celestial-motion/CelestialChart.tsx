import { craftsAt, groundPoint, SIDEREAL_DAY, type Scenario } from './model'

export function CelestialChart({ scenario }: { scenario: Scenario }) {
  if (scenario.mode === 'synchronous') return <GroundTrack scenario={scenario} />
  return <PlaneChart scenario={scenario} />
}

function GroundTrack({ scenario }: { scenario: Scenario }) {
  const width = 640
  const height = 280
  const plot = { left: 42, right: 16, top: 36, bottom: 36 }
  const mapX = (longitude: number) => plot.left + ((longitude + 180) / 360) * (width - plot.left - plot.right)
  const mapY = (latitude: number) => plot.top + ((60 - latitude) / 120) * (height - plot.top - plot.bottom)
  const samples = Array.from({ length: 241 }, (_, index) => {
    const point = groundPoint(scenario.inclination, scenario.phase, (SIDEREAL_DAY * index) / 240)
    return { longitude: (point.longitude * 180) / Math.PI, latitude: (point.latitude * 180) / Math.PI }
  })
  let path = ''
  let previous = 0
  samples.forEach((point, index) => {
    const command = index === 0 || Math.abs(point.longitude - previous) > 180 ? 'M' : 'L'
    path += `${command}${mapX(point.longitude).toFixed(1)} ${mapY(point.latitude).toFixed(1)} `
    previous = point.longitude
  })
  const current = groundPoint(scenario.inclination, scenario.phase, scenario.time)
  const longitude = (current.longitude * 180) / Math.PI
  const latitude = (current.latitude * 180) / Math.PI
  return (
    <svg className="celestial-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="星下点轨迹">
      <rect width={width} height={height} rx="12" fill="#f7fbfb" />
      <text x="16" y="22" fontSize="14" fontWeight="700" fill="#24525c">星下点轨迹，地球固定坐标</text>
      <rect x={plot.left} y={plot.top} width={width - plot.left - plot.right} height={height - plot.top - plot.bottom} fill="#f4f7f6" stroke="#b7c9c6" />
      {[-180, -90, 0, 90, 180].map((degree) => (
        <line key={degree} x1={mapX(degree)} y1={plot.top} x2={mapX(degree)} y2={height - plot.bottom} stroke={degree === 0 ? '#0d5c63' : '#d5e4e1'} />
      ))}
      {[-60, 0, 60].map((degree) => (
        <line key={degree} x1={plot.left} y1={mapY(degree)} x2={width - plot.right} y2={mapY(degree)} stroke={degree === 0 ? '#0d5c63' : '#d5e4e1'} />
      ))}
      <path d={path} fill="none" stroke="#d9480f" strokeWidth="2" />
      <circle data-testid="ground-point" cx={mapX(longitude)} cy={mapY(latitude)} r="5" fill="#0d5c63" stroke="#fff" strokeWidth="2" />
      <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="12" fill="#4d646c">经度 / °</text>
    </svg>
  )
}

function PlaneChart({ scenario }: { scenario: Scenario }) {
  const width = 640
  const height = 280
  const center = { x: 250, y: 150 }
  const reach = Math.max(scenario.q1, scenario.mode === 'circular' ? scenario.q1 : scenario.q2) * 1.15
  const scale = 108 / reach
  const map = (x: number, y: number) => [center.x + x * scale, center.y - y * scale]
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
  const pathOf = (points: number[][]) => points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' ')
  const crafts = craftsAt(scenario)
  const [originX, originY] = map(0, 0)
  return (
    <svg className="celestial-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="轨道平面图">
      <rect width={width} height={height} rx="12" fill="#f7fbfb" />
      <text x="16" y="22" fontSize="14" fontWeight="700" fill="#24525c">轨道平面，焦点在中心天体</text>
      <circle cx={originX} cy={originY} r={scale} fill={scenario.body.color} opacity="0.85" />
      {scenario.mode === 'transfer' ? (
        <path d={pathOf(ellipse())} fill="none" stroke="#d9480f" strokeWidth="2" />
      ) : (
        <>
          <path d={pathOf(loop(scenario.q1))} fill="none" stroke="#0d5c63" strokeWidth="2" />
          {scenario.mode === 'rendezvous' ? <path d={pathOf(loop(scenario.q2))} fill="none" stroke="#5dade2" strokeWidth="2" /> : null}
        </>
      )}
      {crafts.map((craft) => {
        const [x, y] = map(craft.plane.x, craft.plane.y)
        return <circle key={craft.id} cx={x} cy={y} r="5" fill={craft.color} />
      })}
      <text x="430" y="78" fontSize="13" fill="#24525c">v = √(GM/r)</text>
      <text x="430" y="104" fontSize="13" fill="#24525c">T = 2π√(r³/GM)</text>
      <text x="430" y="130" fontSize="13" fill="#24525c">r³/T² = GM/4π²</text>
      <text x="430" y="168" fontSize="13" fill="#d9480f">r 增大，v 减小，T 增大</text>
    </svg>
  )
}
