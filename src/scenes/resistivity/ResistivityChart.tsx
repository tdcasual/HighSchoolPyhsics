import { element, ELEMENTS, type ElementKind } from './model'

type Point = [number, number]

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
  const width = 640
  const height = 220
  const pad = { left: 46, right: 16, top: 28, bottom: 32 }
  const xs = points.map((point) => point[0])
  const ys = points.map((point) => point[1])
  const xMax = Math.max(0.05, ...xs, slope ? Math.max(...xs) : 0)
  const yMax = Math.max(0.05, ...ys, slope ? slope * xMax + intercept : 0)
  const mapX = (value: number) => pad.left + (value / xMax) * (width - pad.left - pad.right)
  const mapY = (value: number) => height - pad.bottom - (value / yMax) * (height - pad.top - pad.bottom)
  const line = slope === null ? '' : `M ${mapX(0)} ${mapY(intercept)} L ${mapX(xMax)} ${mapY(slope * xMax + intercept)}`
  return (
    <svg className="resistivity-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
      <rect width={width} height={height} rx="12" fill="#f7fbfb" />
      <text x="16" y="20" fontSize="14" fontWeight="700" fill="#24525c">{title}</text>
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} stroke="#8aa0a6" />
      <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} stroke="#8aa0a6" />
      <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="12" fill="#4d646c">{xLabel}</text>
      <text x="14" y={height / 2} fontSize="12" fill="#4d646c" transform={`rotate(-90 14 ${height / 2})`}>{yLabel}</text>
      {line ? <path data-testid="fit-line" d={line} stroke="#c96b3f" strokeWidth="2" fill="none" /> : null}
      {points.map((point, index) => (
        <circle key={index} cx={mapX(point[0])} cy={mapY(point[1])} r="4" fill="#24525c" />
      ))}
    </svg>
  )
}

export function ElementChart({ kind, voltage }: { kind: ElementKind; voltage: number }) {
  const info = ELEMENTS[kind]
  const samples: Point[] = []
  const steps = 48
  for (let index = 0; index <= steps; index += 1) {
    const u = info.min + ((info.max - info.min) * index) / steps
    samples.push([u, element(kind, u).I])
  }
  const width = 640
  const height = 220
  const pad = { left: 46, right: 16, top: 28, bottom: 32 }
  const xSpan = info.max - info.min || 1
  const yMax = info.Imax
  const yMin = kind === 'diode' ? -0.002 : 0
  const mapX = (value: number) => pad.left + ((value - info.min) / xSpan) * (width - pad.left - pad.right)
  const mapY = (value: number) => height - pad.bottom - ((value - yMin) / (yMax - yMin)) * (height - pad.top - pad.bottom)
  const path = samples.map((point, index) => `${index === 0 ? 'M' : 'L'} ${mapX(point[0]).toFixed(1)} ${mapY(point[1]).toFixed(1)}`).join(' ')
  const now = element(kind, voltage)
  return (
    <svg className="resistivity-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="伏安特性曲线">
      <rect width={width} height={height} rx="12" fill="#f7fbfb" />
      <text x="16" y="20" fontSize="14" fontWeight="700" fill="#24525c">{info.name}</text>
      <path data-testid="iv-curve" d={path} stroke="#24525c" strokeWidth="2" fill="none" />
      <circle data-testid="iv-point" cx={mapX(now.U)} cy={mapY(now.I)} r="5" fill="#c96b3f" />
    </svg>
  )
}
