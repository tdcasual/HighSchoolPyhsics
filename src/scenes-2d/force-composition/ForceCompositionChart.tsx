import { useMemo } from 'react'
import { buildRangeSweep } from './model'
import type { ForceCompositionSceneState } from './useForceCompositionSceneState'

type Props = { state: ForceCompositionSceneState }
const WIDTH = 380
const HEIGHT = 220

function path(points: Array<[number, number]>, map: (point: [number, number]) => [number, number]): string {
  return points.map((point, index) => { const [x, y] = map(point); return `${index ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}` }).join(' ')
}

function bar(label: string, value: number, colorClass: string, y: number) {
  const width = Math.min(270, Math.max(2, Math.abs(value) * 9))
  return <g key={label}><rect x="44" y={y - 16} width={width} height="22" rx="8" className={`force-chart-bar ${colorClass}`} /><text x="50" y={y - 1}>{label} {value.toFixed(1)} N</text></g>
}

export function ForceCompositionChart({ state }: Props) {
  const readings = state.readings
  const isRange = state.mode === 'range'
  const sweep = useMemo(() => buildRangeSweep(state.rangeF1, state.rangeF2, 180), [state.rangeF1, state.rangeF2])
  const rangeMin = readings.rangeMin
  const rangeMax = Math.max(readings.rangeMax, rangeMin + 1)
  const rangeY = (value: number) => 180 - ((value - rangeMin) / (rangeMax - rangeMin)) * 140
  const sweepPath = path(sweep, ([theta, value]) => [26 + theta / 180 * 330, rangeY(value)])
  const currentX = 26 + readings.rangeAngleDeg / 180 * 330
  const currentY = rangeY(readings.rangeCurrent)
  const title = state.mode === 'range' ? '合力随夹角变化' : state.mode === 'orthogonal' ? '正交分量读数' : state.mode === 'effect' ? '按效果分解读数' : '矢量大小对比'
  const legend = state.mode === 'range' ? '曲线：F合(θ)' : state.mode === 'orthogonal' ? 'F、Fx、Fy' : state.mode === 'effect' ? 'G、G∥、G⊥' : 'F₁、F₂、F合'
  return <div className="force-composition-chart-shell">
    <div className="force-composition-chart-heading"><h3>{title}</h3><span>{isRange && state.rangeSweep ? (state.running ? '扫描中' : '已暂停') : '参数读数'}</span></div>
    <svg className="force-composition-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title}>
      <line x1="26" y1="180" x2="356" y2="180" className="force-chart-axis" /><line x1="26" y1="24" x2="26" y2="180" className="force-chart-axis" />
      {isRange && <><polyline points={sweepPath} className="force-chart-range" /><line x1={currentX} y1="24" x2={currentX} y2="180" className="force-chart-tracker" /><circle cx={currentX} cy={currentY} r="4" className="force-chart-point" /><text x="26" y="204">0°</text><text x="191" y="204" textAnchor="middle">90°</text><text x="356" y="204" textAnchor="end">180°</text><text x="31" y="20">F合 / N</text><text x="31" y="194">{rangeMin.toFixed(0)}</text><text x="31" y="34">{rangeMax.toFixed(0)}</text></>}
      {state.mode === 'synthesis' && <>{bar('F₁', readings.f1Magnitude, 'f1', 60)}{bar('F₂', readings.f2Magnitude, 'f2', 105)}{bar('F合', readings.sumMagnitude, 'sum', 150)}</>}
      {state.mode === 'orthogonal' && <>{bar('F', readings.orthogonalMagnitude, 'sum', 60)}{bar('Fx', readings.fx, 'f1', 105)}{bar('Fy', readings.fy, 'f2', 150)}</>}
      {state.mode === 'effect' && <>{bar('G', readings.gravity, 'f1', 60)}{bar('G∥', readings.downSlope, 'f2', 105)}{bar('G⊥', readings.normal, 'sum', 150)}</>}
    </svg>
    <div className="force-composition-chart-legend"><span><i className="force-dot f1" />{legend}</span></div>
  </div>
}
