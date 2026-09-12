import { useMemo } from 'react'

type Props = { trace: Array<[number, number]>; beam: [number, number]; running: boolean; mode: string }
const WIDTH = 360
const HEIGHT = 230
function pointToSvg([x, y]: [number, number]): string {
  return (((x + 1) / 2 * WIDTH).toFixed(2)) + ',' + (((1 - y) / 2 * HEIGHT).toFixed(2))
}

export function Oscilloscope3dChart({ trace, beam, running, mode }: Props) {
  const points = useMemo(() => trace.map(pointToSvg).join(' '), [trace])
  const [beamX, beamY] = pointToSvg(beam).split(',').map(Number)
  return <div className="osc3d-chart-shell">
    <div className="osc3d-chart-heading"><h3>荧光屏波形</h3><span>{running ? '扫描中' : '已暂停'} · {mode}</span></div>
    <svg className="osc3d-chart" viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT} role="img" aria-label="示波器荧光屏波形图">
      <defs><filter id="osc3d-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <g className="osc3d-grid">
        {Array.from({ length: 11 }, (_, i) => <line key={'x-' + i} x1={i * WIDTH / 10} y1="0" x2={i * WIDTH / 10} y2={HEIGHT} />)}
        {Array.from({ length: 9 }, (_, i) => <line key={'y-' + i} x1="0" y1={i * HEIGHT / 8} x2={WIDTH} y2={i * HEIGHT / 8} />)}
      </g>
      <line className="osc3d-axis" x1={WIDTH / 2} y1="0" x2={WIDTH / 2} y2={HEIGHT} />
      <line className="osc3d-axis" x1="0" y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} />
      <g filter="url(#osc3d-glow)"><polyline className="osc3d-trace-halo" points={points} /><polyline className="osc3d-trace" points={points} /></g>
      <circle className="osc3d-beam" cx={beamX} cy={beamY} r="4" />
    </svg>
    <div className="osc3d-chart-legend"><span><i className="osc3d-dot signal" />Y 偏转/信号</span><span><i className="osc3d-dot time" />X 偏转/时基</span></div>
  </div>
}
