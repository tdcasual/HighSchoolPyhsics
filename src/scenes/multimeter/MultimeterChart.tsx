import { rheostat, trialContact, voltAmmeter } from './model'
import { needleRotation } from './pose'

export function ReadingChart({ fraction, caption }: { fraction: number; caption: string }) {
  const angle = -Math.PI / 2 + (Math.max(-0.035, Math.min(1.04, fraction)) - 0.5) * 2 * (48 * Math.PI / 180)
  const x2 = 180 + Math.cos(angle) * 120
  const y2 = 210 + Math.sin(angle) * 120
  return (
    <svg className="multimeter-chart" viewBox="0 0 360 230" role="img" aria-label="多用电表读数">
      <rect width="360" height="230" rx="12" fill="#f7fbfb" />
      <text x="16" y="24" fontSize="14" fontWeight="700" fill="#24525c">{caption}</text>
      <path d={`M ${180 + Math.cos(-Math.PI / 2 - 48 * Math.PI / 180) * 120} ${210 + Math.sin(-Math.PI / 2 - 48 * Math.PI / 180) * 120} A 120 120 0 0 1 ${180 + Math.cos(-Math.PI / 2 + 48 * Math.PI / 180) * 120} ${210 + Math.sin(-Math.PI / 2 + 48 * Math.PI / 180) * 120}`} fill="none" stroke="#1b2427" strokeWidth="3" />
      <line data-testid="chart-needle" x1="180" y1="210" x2={x2} y2={y2} stroke="#c0392b" strokeWidth="3" />
      <text x="180" y="168" textAnchor="middle" fontSize="12" fill="#4d646c">偏转 {fraction.toFixed(3)} · 转角 {(needleRotation(fraction) * 180 / Math.PI).toFixed(1)}°</text>
    </svg>
  )
}

export function VoltAmmeterChart({ lgRx, ammeterResistance, voltmeterResistance }: { lgRx: number; ammeterResistance: number; voltmeterResistance: number }) {
  const samples = Array.from({ length: 25 }, (_, index) => {
    const rx = 10 ** (-0.2 + index * 0.2)
    const result = voltAmmeter({ Rx: rx, RA: ammeterResistance, RV: voltmeterResistance, E: 3, Rs: 10 })
    return { rx, external: Math.abs(result.external.error) * 100, internal: Math.abs(result.internal.error) * 100 }
  })
  const width = 640
  const height = 220
  const mapX = (value: number) => 48 + ((Math.log10(value) + 0.2) / 4.8) * 560
  const mapY = (value: number) => 190 - Math.min(value, 80) / 80 * 150
  const path = (key: 'external' | 'internal') => samples.map((sample, index) => `${index ? 'L' : 'M'} ${mapX(sample.rx).toFixed(1)} ${mapY(sample[key]).toFixed(1)}`).join(' ')
  const current = voltAmmeter({ Rx: 10 ** lgRx, RA: ammeterResistance, RV: voltmeterResistance, E: 3, Rs: 10 })
  const trial = trialContact({ Rx: 10 ** lgRx, RA: ammeterResistance, RV: voltmeterResistance, E: 3, Rs: 10 })
  return (
    <svg className="multimeter-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="内外接误差">
      <rect width={width} height={height} rx="12" fill="#f7fbfb" />
      <text x="16" y="22" fontSize="14" fontWeight="700" fill="#24525c">误差绝对值 · {trial.reason}</text>
      <path d={path('external')} fill="none" stroke="#2e6592" strokeWidth="2" />
      <path d={path('internal')} fill="none" stroke="#c96b3f" strokeWidth="2" />
      <circle cx={mapX(10 ** lgRx)} cy={mapY(Math.abs(current.external.error) * 100)} r="4" fill="#2e6592" />
      <text x="16" y="208" fontSize="12" fill="#4d646c">外接 {current.external.R.toFixed(2)} Ω · 内接 {current.internal.R.toFixed(2)} Ω · 临界 {current.critical.toFixed(1)} Ω</text>
    </svg>
  )
}

export function RheostatChart({ slider, load, rheostatResistance }: { slider: number; load: number; rheostatResistance: number }) {
  const samples = Array.from({ length: 21 }, (_, index) => {
    const position = index / 20
    const result = rheostat({ E: 3, r: 0.5, R0: rheostatResistance, Rx: load, s: position })
    return { position, limit: result.limit.U, divider: result.divider.U }
  })
  const width = 640
  const height = 220
  const mapX = (value: number) => 48 + value * 560
  const mapY = (value: number) => 190 - (value / 3) * 150
  const path = (key: 'limit' | 'divider') => samples.map((sample, index) => `${index ? 'L' : 'M'} ${mapX(sample.position).toFixed(1)} ${mapY(sample[key]).toFixed(1)}`).join(' ')
  const now = rheostat({ E: 3, r: 0.5, R0: rheostatResistance, Rx: load, s: slider })
  return (
    <svg className="multimeter-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="限流与分压">
      <rect width={width} height={height} rx="12" fill="#f7fbfb" />
      <text x="16" y="22" fontSize="14" fontWeight="700" fill="#24525c">蓝: 限流  橙: 分压</text>
      <path d={path('limit')} fill="none" stroke="#2e6592" strokeWidth="2" />
      <path d={path('divider')} fill="none" stroke="#c96b3f" strokeWidth="2" />
      <circle data-testid="rheostat-point" cx={mapX(slider)} cy={mapY(now.divider.U)} r="5" fill="#c96b3f" />
      <text x="16" y="208" fontSize="12" fill="#4d646c">限流 {now.limit.U.toFixed(2)} V · 分压 {now.divider.U.toFixed(2)} V · 分压可从 0 调到 {now.dividerRange[1].toFixed(2)} V</text>
    </svg>
  )
}
