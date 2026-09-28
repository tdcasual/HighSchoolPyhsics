import { differential, element, ELEMENTS, type ElementKind } from './model'

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
      {Array.from({ length: 5 }, (_, tick) => {
        const x = xMax * tick / 4
        const y = yMax * tick / 4
        return (
          <g key={tick}>
            <line x1={mapX(x)} y1={pad.top} x2={mapX(x)} y2={height - pad.bottom} stroke="#dce5e7" strokeWidth="0.8" />
            <line x1={pad.left} y1={mapY(y)} x2={width - pad.right} y2={mapY(y)} stroke="#dce5e7" strokeWidth="0.8" />
            <text x={mapX(x)} y={height - pad.bottom + 13} textAnchor="middle" fontSize="9" fill="#60757b">{x.toFixed(xMax < 1 ? 2 : 1)}</text>
            <text x={pad.left - 5} y={mapY(y) + 3} textAnchor="end" fontSize="9" fill="#60757b">{y.toFixed(yMax < 1 ? 2 : 1)}</text>
          </g>
        )
      })}
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

export function ElementChart({ kind, voltage, showSecant = true, showTangent = false }: { kind: ElementKind; voltage: number; showSecant?: boolean; showTangent?: boolean }) {
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
  const tangentSlope = differential(kind, voltage)
  const tangentSpan = xSpan * 0.18
  const tangentU0 = Math.max(info.min, now.U - tangentSpan)
  const tangentU1 = Math.min(info.max, now.U + tangentSpan)
  const tangentI0 = now.I + tangentSlope * (tangentU0 - now.U)
  const tangentI1 = now.I + tangentSlope * (tangentU1 - now.U)
  const secantPath = Math.abs(now.U) < 1e-9 ? '' : `M ${mapX(0)} ${mapY(0)} L ${mapX(now.U)} ${mapY(now.I)}`
  const tangentPath = `M ${mapX(tangentU0)} ${mapY(tangentI0)} L ${mapX(tangentU1)} ${mapY(tangentI1)}`
  const clipId = `iv-chart-plot-${kind}`
  return (
    <svg className="resistivity-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="伏安特性曲线">
      <rect width={width} height={height} rx="12" fill="#f7fbfb" />
      <text x="16" y="20" fontSize="14" fontWeight="700" fill="#24525c">{info.name}</text>
      <text x={width - 16} y="20" textAnchor="end" fontSize="11" fill="#50666c">U = {now.U.toFixed(2)} V · I = {now.I.toExponential(2)} A</text>
      {Array.from({ length: 5 }, (_, tick) => {
        const fraction = tick / 4
        const x = info.min + xSpan * fraction
        const y = yMin + (yMax - yMin) * fraction
        return (
          <g key={tick}>
            <line x1={mapX(x)} y1={pad.top} x2={mapX(x)} y2={height - pad.bottom} stroke="#dce5e7" strokeWidth="0.8" />
            <line x1={pad.left} y1={mapY(y)} x2={width - pad.right} y2={mapY(y)} stroke="#dce5e7" strokeWidth="0.8" />
            <text x={mapX(x)} y={height - pad.bottom + 13} textAnchor="middle" fontSize="9" fill="#60757b">{x.toFixed(kind === 'diode' ? 1 : 2)}</text>
            <text x={pad.left - 5} y={mapY(y) + 3} textAnchor="end" fontSize="9" fill="#60757b">{y.toPrecision(2)}</text>
          </g>
        )
      })}
      {yMin < 0 ? <line x1={pad.left} y1={mapY(0)} x2={width - pad.right} y2={mapY(0)} stroke="#81969b" strokeWidth="1.2" /> : null}
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} stroke="#8aa0a6" />
      <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} stroke="#8aa0a6" />
      <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#4d646c">U / V</text>
      <text x="14" y={height / 2} fontSize="11" fill="#4d646c" transform={"rotate(-90 14 " + (height / 2) + ")"}>I / A</text>
      <defs><clipPath id={clipId}><rect x={pad.left} y={pad.top} width={width - pad.left - pad.right} height={height - pad.top - pad.bottom} /></clipPath></defs>
      <g clipPath={`url(#${clipId})`}>
        <path data-testid="iv-curve" d={path} stroke="#24525c" strokeWidth="2" fill="none" />
        {showSecant && secantPath ? <path data-testid="iv-secant" d={secantPath} stroke="#c96b3f" strokeWidth="1.6" strokeDasharray="6 4" fill="none"><title>割线：R = U/I</title></path> : null}
        {showTangent ? <path data-testid="iv-tangent" d={tangentPath} stroke="#2a9d8f" strokeWidth="1.6" strokeDasharray="3 3" fill="none"><title>切线：斜率 dI/dU</title></path> : null}
        <circle data-testid="iv-point" cx={mapX(now.U)} cy={mapY(now.I)} r="5" fill="#c96b3f" />
      </g>
    </svg>
  )
}
