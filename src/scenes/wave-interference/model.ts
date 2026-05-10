export type Vec2 = { x: number; z: number }

export type WaveParams = {
  wavelength1: number
  wavelength2: number
  amplitude1: number
  amplitude2: number
  phaseDiff: number
  waveSpeed: number
  source1: Vec2
  source2: Vec2
}

export type Observer = {
  x: number
  z: number
  history: number[]
  history1: number[]
  history2: number[]
}

export const DEFAULT_PARAMS: WaveParams = {
  wavelength1: 0.6,
  wavelength2: 0.6,
  amplitude1: 0.15,
  amplitude2: 0.15,
  phaseDiff: 0,
  waveSpeed: 2.0,
  source1: { x: -0.8, z: 0 },
  source2: { x: 0.8, z: 0 },
}

export const GRID_SIZE = 6
export const MAX_HISTORY = 100
export const OBSERVER_DEFAULT: Vec2 = { x: 0, z: 0 }

export function calcWaveDisplacement(
  pos: Vec2,
  source: Vec2,
  t: number,
  wavelength: number,
  amplitude: number,
  phaseOffset = 0,
): number {
  const dx = pos.x - source.x
  const dz = pos.z - source.z
  const r = Math.sqrt(dx * dx + dz * dz)
  const k = (2 * Math.PI) / wavelength
  const omega = 2.0 * k
  return amplitude * Math.sin(k * r - omega * t + phaseOffset)
}

export function calcCombinedDisplacement(pos: Vec2, params: WaveParams, t: number): number {
  const y1 = calcWaveDisplacement(pos, params.source1, t, params.wavelength1, params.amplitude1, 0)
  const y2 = calcWaveDisplacement(pos, params.source2, t, params.wavelength2, params.amplitude2, params.phaseDiff)
  return y1 + y2
}

export function calcDistances(pos: Vec2, s1: Vec2, s2: Vec2): { r1: number; r2: number; dr: number } {
  const r1 = Math.sqrt((pos.x - s1.x) ** 2 + (pos.z - s1.z) ** 2)
  const r2 = Math.sqrt((pos.x - s2.x) ** 2 + (pos.z - s2.z) ** 2)
  return { r1, r2, dr: r2 - r1 }
}

export function calcPhaseDiff(pos: Vec2, params: WaveParams): number {
  const { r1, r2 } = calcDistances(pos, params.source1, params.source2)
  const k1 = (2 * Math.PI) / params.wavelength1
  const k2 = (2 * Math.PI) / params.wavelength2
  return r2 * k2 + params.phaseDiff - r1 * k1
}

export function calcCombinedAmplitude(params: WaveParams, dphi: number): number {
  const a1 = params.amplitude1
  const a2 = params.amplitude2
  return Math.sqrt(a1 * a1 + a2 * a2 + 2 * a1 * a2 * Math.cos(dphi))
}

export type InterferenceType = 'constructive' | 'destructive' | 'partial'

export function getInterferenceStatus(dr: number, params: WaveParams): {
  type: InterferenceType
  n: number
  label: string
} {
  const avgLambda = (params.wavelength1 + params.wavelength2) / 2
  const effectiveDr = dr + (params.phaseDiff / (2 * Math.PI)) * avgLambda
  const n = Math.round(effectiveDr / avgLambda)
  const remainder = Math.abs(effectiveDr - n * avgLambda)
  const halfRemainder = Math.abs(effectiveDr - (n + 0.5) * avgLambda)
  const tolerance = 0.05 * avgLambda

  if (remainder < tolerance) {
    return { type: 'constructive', n, label: '振动加强区（波腹）' }
  }
  if (halfRemainder < tolerance) {
    return { type: 'destructive', n, label: '振动减弱区（波节）' }
  }
  return { type: 'partial', n, label: '部分干涉区' }
}

export function buildHyperbolaPoints(
  s1: Vec2,
  s2: Vec2,
  aVal: number,
): [number, number, number][] {
  const dx = s2.x - s1.x
  const dz = s2.z - s1.z
  const d = Math.sqrt(dx * dx + dz * dz)
  const c = d / 2
  if (aVal <= 0 || aVal >= c) return []

  const b = Math.sqrt(c * c - aVal * aVal)
  const angle = Math.atan2(dz, dx)
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)
  const cx = (s1.x + s2.x) / 2
  const cz = (s1.z + s2.z) / 2

  const points: [number, number, number][] = []
  const halfGrid = GRID_SIZE / 2

  for (const side of [-1, 1]) {
    for (let i = 0; i <= 80; i++) {
      const t = (i / 80) * 3 - 1.5
      const x = side * aVal * Math.cosh(t)
      const y = b * Math.sinh(t)
      const rx = cx + x * cosA - y * sinA
      const rz = cz + x * sinA + y * cosA
      if (Math.abs(rx) < halfGrid && Math.abs(rz) < halfGrid) {
        points.push([rx, 0.02, rz])
      }
    }
  }
  return points
}
