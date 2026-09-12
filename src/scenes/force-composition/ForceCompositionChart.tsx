import { useMemo } from 'react'
import { buildRangeSweep } from './model'
import type { ForceCompositionSceneState } from './useForceCompositionSceneState'

type Props = { state: ForceCompositionSceneState }
const WIDTH = 380
const HEIGHT = 220
function path(points: Array<[number, number]>, map: (point: [number, number]) => [number, number]): string { return points.map((point, index) => { const [x, y] = map(point); return `${index ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}` }).join(' ') }

export function ForceCompositionChart({ state }: Props) {
  const readings = state.readings
  const isRange = state.mode === 'range'
  const sweep = useMemo(() => buildRangeSweep(180), [])
  const sweepPath = path(sweep, ([theta, value]) => [26 + theta / 180 * 330, 105 - value * 75])
  const currentX = 26 + state.rangeAngleDeg / 180 * 330
  return <div className="force-composition-chart-shell"><div className="force-composition-chart-heading"><h3>{isRange ? '合力随夹角变化' : '矢量关系与分量读数'}</h3><span>{state.running ? '演变中' : '已暂停'}</span></div><svg className="force-composition-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="力的合成与分解数据图"><line x1="26" y1="105" x2="356" y2="105" className="force-chart-axis" /><line x1="26" y1="24" x2="26" y2="188" className="force-chart-axis" />{isRange ? <><polyline points={sweepPath} className="force-chart-range" /><line x1={currentX} y1="24" x2={currentX} y2="188" className="force-chart-tracker" /><circle cx={currentX} cy={105 - Math.cos(state.rangeAngleDeg * Math.PI / 180) * 75} r="4" className="force-chart-point" /><text x="26" y="205">0°</text><text x="191" y="205" textAnchor="middle">90°</text><text x="356" y="205" textAnchor="end">180°</text><text x="31" y="20">F合</text></> : <><rect x="44" y="55" width="110" height="22" rx="8" className="force-chart-bar f1" /><rect x="44" y="92" width={Math.max(2, Math.abs(readings.f2Magnitude) * 12)} height="22" rx="8" className="force-chart-bar f2" /><rect x="44" y="129" width={Math.max(2, readings.sumMagnitude * 12)} height="22" rx="8" className="force-chart-bar sum" /><text x="162" y="71">F₁ {readings.f1Magnitude.toFixed(1)} N</text><text x="162" y="108">F₂ {readings.f2Magnitude.toFixed(1)} N</text><text x="162" y="145">F合 {readings.sumMagnitude.toFixed(1)} N</text></>}</svg><div className="force-composition-chart-legend"><span><i className="force-dot f1" />F₁</span><span><i className="force-dot f2" />F₂</span><span><i className="force-dot sum" />合力/读数</span></div></div>
}
