import { rheostat, trialContact, voltAmmeter } from './model'
import { needleRotation } from './pose'

const SCALE_MIN_LOG = -0.2
const SCALE_MAX_LOG = 4.6

export function ReadingChart({ fraction, caption }: { fraction: number; caption: string }) {
  const clamped = Math.max(-0.035, Math.min(1.04, fraction))
  const angle = -Math.PI / 2 + (clamped - 0.5) * 2 * (48 * Math.PI / 180)
  const x2 = 180 + Math.cos(angle) * 120
  const y2 = 210 + Math.sin(angle) * 120
  const start = -Math.PI / 2 - 48 * Math.PI / 180
  const end = -Math.PI / 2 + 48 * Math.PI / 180
  const ticks = Array.from({ length: 11 }, (_, index) => {
    const theta = start + ((end - start) * index) / 10
    return {
      index,
      x1: 180 + Math.cos(theta) * 120,
      y1: 210 + Math.sin(theta) * 120,
      x2: 180 + Math.cos(theta) * (index % 2 === 0 ? 105 : 112),
      y2: 210 + Math.sin(theta) * (index % 2 === 0 ? 105 : 112),
      tx: 180 + Math.cos(theta) * 91,
      ty: 210 + Math.sin(theta) * 91,
    }
  })
  return (
    <svg className="multimeter-chart multimeter-reading-chart" viewBox="0 0 360 250" role="img" aria-label="多用电表读数">
      <rect width="360" height="250" rx="12" fill="#f7fbfb" />
      <text x="16" y="24" fontSize="14" fontWeight="700" fill="#24525c">{caption}</text>
      <path d={`M ${180 + Math.cos(start) * 120} ${210 + Math.sin(start) * 120} A 120 120 0 0 1 ${180 + Math.cos(end) * 120} ${210 + Math.sin(end) * 120}`} fill="none" stroke="#1b2427" strokeWidth="2.5" />
      {ticks.map((tick) => <g key={tick.index}>
        <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="#1b2427" strokeWidth={tick.index % 2 === 0 ? 1.5 : 0.8} />
        {tick.index % 2 === 0 && <text x={tick.tx} y={tick.ty + 4} textAnchor="middle" fontSize="10" fill="#24525c">{tick.index}</text>}
      </g>)}
      <line data-testid="chart-needle" x1="180" y1="210" x2={x2} y2={y2} stroke="#c0392b" strokeWidth="3" />
      <circle cx="180" cy="210" r="4" fill="#26343a" />
      <text x="180" y="244" textAnchor="middle" fontSize="11" fill="#4d646c">偏转 {fraction.toFixed(3)} · 转角 {(needleRotation(fraction) * 180 / Math.PI).toFixed(1)}°</text>
    </svg>
  )
}

export function VoltAmmeterChart({ lgRx, ammeterResistance, voltmeterResistance, method = 'external' }: { lgRx: number; ammeterResistance: number; voltmeterResistance: number; method?: 'external' | 'internal' }) {
  const samples = Array.from({ length: 49 }, (_, index) => {
    const rx = 10 ** (SCALE_MIN_LOG + (index * (SCALE_MAX_LOG - SCALE_MIN_LOG)) / 48)
    const result = voltAmmeter({ Rx: rx, RA: ammeterResistance, RV: voltmeterResistance, E: 3, Rs: 10 })
    return { rx, external: Math.abs(result.external.error) * 100, internal: Math.abs(result.internal.error) * 100 }
  })
  const width = 640
  const height = 260
  const plot = { left: 58, right: 610, top: 42, bottom: 196 }
  const mapX = (value: number) => plot.left + ((Math.log10(value) - SCALE_MIN_LOG) / (SCALE_MAX_LOG - SCALE_MIN_LOG)) * (plot.right - plot.left)
  const mapY = (value: number) => plot.bottom - Math.min(value, 80) / 80 * (plot.bottom - plot.top)
  const path = (key: 'external' | 'internal') => samples.map((sample, index) => `${index ? 'L' : 'M'} ${mapX(sample.rx).toFixed(1)} ${mapY(sample[key]).toFixed(1)}`).join(' ')
  const current = voltAmmeter({ Rx: 10 ** lgRx, RA: ammeterResistance, RV: voltmeterResistance, E: 3, Rs: 10 })
  const trial = trialContact({ Rx: 10 ** lgRx, RA: ammeterResistance, RV: voltmeterResistance, E: 3, Rs: 10 })
  const selected = current[method]
  const selectedColor = method === 'external' ? '#2e6592' : '#c96b3f'
  const xTicks = [1, 10, 100, 1000, 10000]
  const yTicks = [0, 20, 40, 60, 80]
  return (
    <svg className="multimeter-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="内外接误差">
      <rect width={width} height={height} rx="12" fill="#f7fbfb" />
      <text x="16" y="22" fontSize="14" fontWeight="700" fill="#24525c">内外接法相对误差 · {trial.reason}</text>
      {yTicks.map((tick) => <g key={`y-${tick}`}>
        <line x1={plot.left} y1={mapY(tick)} x2={plot.right} y2={mapY(tick)} stroke="#d6e1e3" strokeWidth="1" />
        <text x={plot.left - 8} y={mapY(tick) + 4} textAnchor="end" fontSize="10" fill="#536970">{tick}%</text>
      </g>)}
      {xTicks.map((tick) => <g key={`x-${tick}`}>
        <line x1={mapX(tick)} y1={plot.top} x2={mapX(tick)} y2={plot.bottom} stroke="#e1e9ea" strokeWidth="1" />
        <text x={mapX(tick)} y={plot.bottom + 16} textAnchor="middle" fontSize="10" fill="#536970">{tick}</text>
      </g>)}
      <line x1={plot.left} y1={plot.bottom} x2={plot.right} y2={plot.bottom} stroke="#40565e" strokeWidth="1.4" />
      <line x1={plot.left} y1={plot.top} x2={plot.left} y2={plot.bottom} stroke="#40565e" strokeWidth="1.4" />
      <path d={path('external')} fill="none" stroke="#2e6592" strokeWidth="2.2" />
      <path d={path('internal')} fill="none" stroke="#c96b3f" strokeWidth="2.2" />
      <circle data-testid="external-point" cx={mapX(10 ** lgRx)} cy={mapY(Math.abs(current.external.error) * 100)} r="4" fill="#2e6592" />
      <circle data-testid="selected-point" cx={mapX(10 ** lgRx)} cy={mapY(Math.abs(selected.error) * 100)} r="6" fill={selectedColor} stroke="#ffffff" strokeWidth="2" />
      <text x={(plot.left + plot.right) / 2} y={plot.bottom + 32} textAnchor="middle" fontSize="10" fill="#536970">待测电阻 Rx / Ω（对数刻度）</text>
      <text x="15" y={(plot.top + plot.bottom) / 2} textAnchor="middle" fontSize="10" fill="#536970" transform={`rotate(-90 15 ${(plot.top + plot.bottom) / 2})`}>相对误差 / %</text>
      <text x="16" y="252" fontSize="11" fill="#4d646c">外接 {current.external.R.toFixed(2)} Ω · 内接 {current.internal.R.toFixed(2)} Ω · 临界值 {current.critical.toFixed(1)} Ω</text>
    </svg>
  )
}

export function RheostatChart({ slider, load, rheostatResistance, mode = 'divider', closed = true }: { slider: number; load: number; rheostatResistance: number; mode?: 'limit' | 'divider'; closed?: boolean }) {
  const samples = Array.from({ length: 21 }, (_, index) => {
    const position = index / 20
    const result = rheostat({ E: 3, r: 0.5, R0: rheostatResistance, Rx: load, s: position })
    return { position, limit: result.limit.U, divider: result.divider.U }
  })
  const width = 640
  const height = 260
  const plot = { left: 56, right: 614, top: 40, bottom: 194 }
  const mapX = (value: number) => plot.left + value * (plot.right - plot.left)
  const mapY = (value: number) => plot.bottom - (value / 3) * (plot.bottom - plot.top)
  const path = (key: 'limit' | 'divider') => samples.map((sample, index) => `${index ? 'L' : 'M'} ${mapX(sample.position).toFixed(1)} ${mapY(sample[key]).toFixed(1)}`).join(' ')
  const now = rheostat({ E: 3, r: 0.5, R0: rheostatResistance, Rx: load, s: slider })
  return (
    <svg className="multimeter-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="限流与分压">
      <rect width={width} height={height} rx="12" fill="#f7fbfb" />
      <text x="16" y="22" fontSize="14" fontWeight="700" fill="#24525c">限流与分压输出电压</text>
      {[0, 1, 2, 3].map((tick) => <g key={`y-${tick}`}>
        <line x1={plot.left} y1={mapY(tick)} x2={plot.right} y2={mapY(tick)} stroke="#d6e1e3" strokeWidth="1" />
        <text x={plot.left - 8} y={mapY(tick) + 4} textAnchor="end" fontSize="10" fill="#536970">{tick}</text>
      </g>)}
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => <g key={`x-${tick}`}>
        <line x1={mapX(tick)} y1={plot.top} x2={mapX(tick)} y2={plot.bottom} stroke="#e1e9ea" strokeWidth="1" />
        <text x={mapX(tick)} y={plot.bottom + 16} textAnchor="middle" fontSize="10" fill="#536970">{tick.toFixed(2)}</text>
      </g>)}
      <line x1={plot.left} y1={plot.bottom} x2={plot.right} y2={plot.bottom} stroke="#40565e" strokeWidth="1.4" />
      <line x1={plot.left} y1={plot.top} x2={plot.left} y2={plot.bottom} stroke="#40565e" strokeWidth="1.4" />
      <path d={path('limit')} fill="none" stroke="#2e6592" strokeWidth="2.2" />
      <path d={path('divider')} fill="none" stroke="#c96b3f" strokeWidth="2.2" />
      <circle data-testid="rheostat-point" cx={mapX(slider)} cy={mapY(closed ? now[mode].U : 0)} r="5" fill={mode === 'limit' ? '#2e6592' : '#c96b3f'} stroke="#ffffff" strokeWidth="2" />
      <text x={(plot.left + plot.right) / 2} y={plot.bottom + 32} textAnchor="middle" fontSize="10" fill="#536970">滑片位置 s（离 a 端比例）</text>
      <text x="15" y={(plot.top + plot.bottom) / 2} textAnchor="middle" fontSize="10" fill="#536970" transform={`rotate(-90 15 ${(plot.top + plot.bottom) / 2})`}>负载电压 U / V</text>
      <text x="16" y="252" fontSize="11" fill="#4d646c">{closed ? '已闭合' : '开关断开'} · 当前{mode === 'limit' ? '限流' : '分压'} {closed ? now[mode].U.toFixed(2) : '0.00'} V · 限流范围 {now.limitRange[0].toFixed(2)}–{now.limitRange[1].toFixed(2)} V · 分压范围 0–{now.dividerRange[1].toFixed(2)} V</text>
    </svg>
  )
}
