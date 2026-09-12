import { useMemo } from 'react'
import { buildPhaseTrace, emfToPlotPoint, phaseToPlotPoint } from './model'

type Props = { angleRad: number; running: boolean }
const WIDTH = 420
const HEIGHT = 250
const PAD = { left: 34, right: 14, top: 20, bottom: 28 }

function mapPoint([x, y]: [number, number]): string {
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  return `${(PAD.left + (x + 1) / 2 * innerWidth).toFixed(2)},${(PAD.top + (1 - y) / 2 * innerHeight).toFixed(2)}`
}

export function GeneratorCoreChart({ angleRad, running }: Props) {
  const trace = useMemo(() => buildPhaseTrace(240), [])
  const fluxPoints = useMemo(() => trace.flux.map(mapPoint).join(' '), [trace.flux])
  const emfPoints = useMemo(() => trace.emf.map(mapPoint).join(' '), [trace.emf])
  const trackerX = mapPoint(phaseToPlotPoint(angleRad))[0]
  const fluxY = mapPoint(phaseToPlotPoint(angleRad)).split(',')[1]
  const emfY = mapPoint(emfToPlotPoint(angleRad)).split(',')[1]
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const centerY = PAD.top + innerHeight / 2
  return <div className="generator-core-chart-shell">
    <div className="generator-core-chart-heading"><h3>磁通量与感应电动势</h3><span>{running ? '旋转中' : '已暂停'} · θ 同步追踪</span></div>
    <svg className="generator-core-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="发电机磁通量和感应电动势相位图">
      <g className="generator-core-grid">{Array.from({ length: 9 }, (_, index) => <line key={`v-${index}`} x1={PAD.left + index * innerWidth / 8} y1={PAD.top} x2={PAD.left + index * innerWidth / 8} y2={HEIGHT - PAD.bottom} />)}{Array.from({ length: 5 }, (_, index) => <line key={`h-${index}`} x1={PAD.left} y1={PAD.top + index * innerHeight / 4} x2={WIDTH - PAD.right} y2={PAD.top + index * innerHeight / 4} />)}</g>
      <line className="generator-core-axis" x1={PAD.left} y1={centerY} x2={WIDTH - PAD.right} y2={centerY} />
      <line className="generator-core-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} />
      <polyline points={fluxPoints} className="generator-core-flux" />
      <polyline points={emfPoints} className="generator-core-emf" />
      <line className="generator-core-tracker" x1={trackerX} y1={PAD.top} x2={trackerX} y2={HEIGHT - PAD.bottom} />
      <circle className="generator-core-flux-point" cx={trackerX} cy={fluxY} r="4.3" />
      <circle className="generator-core-emf-point" cx={trackerX} cy={emfY} r="4.3" />
      <text x={PAD.left - 4} y={PAD.top + 4} textAnchor="end">+1</text><text x={PAD.left - 4} y={centerY + 4} textAnchor="end">0</text><text x={PAD.left - 4} y={HEIGHT - PAD.bottom + 4} textAnchor="end">−1</text>
      <text x={PAD.left} y={HEIGHT - 8}>0</text><text x={PAD.left + innerWidth / 4} y={HEIGHT - 8} textAnchor="middle">π/2</text><text x={PAD.left + innerWidth / 2} y={HEIGHT - 8} textAnchor="middle">π</text><text x={PAD.left + innerWidth * 3 / 4} y={HEIGHT - 8} textAnchor="middle">3π/2</text><text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">2π</text>
      <text x={WIDTH - PAD.right} y={PAD.top - 5} textAnchor="end">e, Φ</text>
    </svg>
    <div className="generator-core-chart-legend"><span><i className="generator-core-legend-dot flux" />Φ/Φₘ = cosθ</span><span><i className="generator-core-legend-dot emf" />e/Eₘ = sinθ</span></div>
  </div>
}

