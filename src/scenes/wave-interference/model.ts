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
  historyTimes: number[]
  time: number
}

export type ObserverBuffer = {
  x: number
  z: number
  time: number
  timeBuf: Float32Array
  buf: Float32Array
  buf1: Float32Array
  buf2: Float32Array
  head: number
  count: number
}

export function createObserverBuffer(x: number, z: number): ObserverBuffer {
  return {
    x, z,
    time: 0,
    timeBuf: new Float32Array(MAX_HISTORY),
    buf: new Float32Array(MAX_HISTORY),
    buf1: new Float32Array(MAX_HISTORY),
    buf2: new Float32Array(MAX_HISTORY),
    head: 0,
    count: 0,
  }
}

export function ringPush(ring: ObserverBuffer, time: number, v: number, v1: number, v2: number) {
  ring.timeBuf[ring.head] = time
  ring.buf[ring.head] = v
  ring.buf1[ring.head] = v1
  ring.buf2[ring.head] = v2
  ring.head = (ring.head + 1) % MAX_HISTORY
  if (ring.count < MAX_HISTORY) ring.count++
}

export function ringToArrays(ring: ObserverBuffer): { history: number[]; history1: number[]; history2: number[]; historyTimes: number[] } {
  const { timeBuf, buf, buf1, buf2, head, count } = ring
  const historyTimes = new Array<number>(count)
  const history = new Array<number>(count)
  const history1 = new Array<number>(count)
  const history2 = new Array<number>(count)
  const start = (head - count + MAX_HISTORY) % MAX_HISTORY
  for (let i = 0; i < count; i++) {
    const idx = (start + i) % MAX_HISTORY
    historyTimes[i] = timeBuf[idx]
    history[i] = buf[idx]
    history1[i] = buf1[idx]
    history2[i] = buf2[idx]
  }
  return { history, history1, history2, historyTimes }
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
export const WAVE_SURFACE_SCALE = 2
export const OBSERVER_DEFAULT: Vec2 = { x: 0, z: 0 }

export function hasEqualWavelengths(wavelength1: number, wavelength2: number): boolean {
  return Math.abs(wavelength1 - wavelength2) < 1e-6
}

export function wrapPhase(phase: number): number {
  return ((phase + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI
}

/** Map world XZ coordinates into the local XY plane rotated by -π/2 around X. */
export function worldToWavePlane(position: Vec2): Vec2 {
  return { x: position.x, z: -position.z }
}

export function calcWaveDisplacement(
  pos: Vec2,
  source: Vec2,
  t: number,
  wavelength: number,
  amplitude: number,
  phaseOffset = 0,
  waveSpeed = 2,
): number {
  const dx = pos.x - source.x
  const dz = pos.z - source.z
  const r = Math.sqrt(dx * dx + dz * dz)
  const k = (2 * Math.PI) / wavelength
  const omega = waveSpeed * k
  return amplitude * Math.sin(k * r - omega * t + phaseOffset)
}

export function calcCombinedDisplacement(pos: Vec2, params: WaveParams, t: number): number {
  const y1 = calcWaveDisplacement(pos, params.source1, t, params.wavelength1, params.amplitude1, 0, params.waveSpeed)
  const y2 = calcWaveDisplacement(pos, params.source2, t, params.wavelength2, params.amplitude2, params.phaseDiff, params.waveSpeed)
  return y1 + y2
}

export function calcDistances(pos: Vec2, s1: Vec2, s2: Vec2): { r1: number; r2: number; dr: number } {
  const r1 = Math.sqrt((pos.x - s1.x) ** 2 + (pos.z - s1.z) ** 2)
  const r2 = Math.sqrt((pos.x - s2.x) ** 2 + (pos.z - s2.z) ** 2)
  return { r1, r2, dr: r2 - r1 }
}

export function calcPhaseDiff(pos: Vec2, params: WaveParams, time = 0): number {
  const { r1, r2 } = calcDistances(pos, params.source1, params.source2)
  const k1 = (2 * Math.PI) / params.wavelength1
  const k2 = (2 * Math.PI) / params.wavelength2
  const omega1 = params.waveSpeed * k1
  const omega2 = params.waveSpeed * k2
  return r2 * k2 + params.phaseDiff - omega2 * time - (r1 * k1 - omega1 * time)
}

export function calcCombinedAmplitude(params: WaveParams, dphi: number): number {
  const a1 = params.amplitude1
  const a2 = params.amplitude2
  return Math.sqrt(Math.max(0, a1 * a1 + a2 * a2 + 2 * a1 * a2 * Math.cos(dphi)))
}

export type InterferenceType = 'constructive' | 'destructive' | 'partial'

export function getInterferenceStatus(
  dr: number,
  params: WaveParams,
  instantaneousPhaseDiff?: number,
): {
  type: InterferenceType
  n: number
  label: string
} {
  if (instantaneousPhaseDiff === undefined && !hasEqualWavelengths(params.wavelength1, params.wavelength2)) {
    return { type: 'partial', n: 0, label: '不同频率：需按当前时刻判定' }
  }
  const phase = instantaneousPhaseDiff ?? (2 * Math.PI * dr / params.wavelength1 + params.phaseDiff)
  const phaseInCycle = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  const constructiveDistance = Math.min(phaseInCycle, 2 * Math.PI - phaseInCycle)
  const destructiveDistance = Math.abs(phaseInCycle - Math.PI)
  const n = Math.round(phase / (2 * Math.PI))
  const tolerance = Math.PI * 0.1
  const equalFrequency = hasEqualWavelengths(params.wavelength1, params.wavelength2)
  const amplitudesMatch = Math.abs(params.amplitude1 - params.amplitude2) <= 1e-6

  if (constructiveDistance < tolerance) {
    return {
      type: 'constructive',
      n,
      label: equalFrequency ? '相长条件（波腹）' : '瞬时相长相位',
    }
  }
  if (destructiveDistance < tolerance) {
    return {
      type: 'destructive',
      n,
      label: !equalFrequency
        ? (amplitudesMatch ? '瞬时相消相位（不是固定波节）' : '瞬时相消相位（位移仍非零）')
        : (amplitudesMatch ? '相消条件（波节）' : '相消条件（最小振幅仍非零）'),
    }
  }
  return { type: 'partial', n, label: '介于相长、相消之间' }
}

export type HyperbolaBranch = [number, number, number][]

type PointXZ = { x: number; z: number }

function clipSegmentToSquare(start: PointXZ, end: PointXZ, limit: number): [PointXZ, PointXZ] | null {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const p = [-dx, dx, -dz, dz]
  const q = [start.x + limit, limit - start.x, start.z + limit, limit - start.z]
  let t0 = 0
  let t1 = 1

  for (let i = 0; i < p.length; i++) {
    if (Math.abs(p[i]) < 1e-12) {
      if (q[i] < 0) return null
      continue
    }
    const ratio = q[i] / p[i]
    if (p[i] < 0) {
      if (ratio > t1) return null
      t0 = Math.max(t0, ratio)
    } else {
      if (ratio < t0) return null
      t1 = Math.min(t1, ratio)
    }
  }

  if (t0 > t1) return null
  return [
    { x: start.x + t0 * dx, z: start.z + t0 * dz },
    { x: start.x + t1 * dx, z: start.z + t1 * dz },
  ]
}

function clipPolylineToGrid(points: PointXZ[]): HyperbolaBranch[] {
  const limit = GRID_SIZE / 2
  const branches: HyperbolaBranch[] = []
  let active: HyperbolaBranch = []
  const flush = () => {
    if (active.length >= 2) branches.push(active)
    active = []
  }

  for (let i = 1; i < points.length; i++) {
    const clipped = clipSegmentToSquare(points[i - 1], points[i], limit)
    if (!clipped) {
      flush()
      continue
    }
    const [start, end] = clipped
    if (Math.hypot(end.x - start.x, end.z - start.z) < 1e-7) continue
    const previous = active[active.length - 1]
    if (previous && Math.hypot(previous[0] - start.x, previous[2] - start.z) < 1e-4) {
      if (Math.hypot(previous[0] - end.x, previous[2] - end.z) >= 1e-7) {
        active.push([end.x, 0.02, end.z])
      }
    } else {
      flush()
      active = [[start.x, 0.02, start.z], [end.x, 0.02, end.z]]
    }
  }

  flush()
  return branches
}

export function buildHyperbolaBranches(
  s1: Vec2,
  s2: Vec2,
  aVal: number,
): HyperbolaBranch[] {
  const dx = s2.x - s1.x
  const dz = s2.z - s1.z
  const d = Math.sqrt(dx * dx + dz * dz)
  const c = d / 2
  if (d === 0 || aVal < 0 || aVal >= c) return []

  const angle = Math.atan2(dz, dx)
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)
  const cx = (s1.x + s2.x) / 2
  const cz = (s1.z + s2.z) / 2
  const halfGrid = GRID_SIZE / 2
  const maxRadius = Math.hypot(halfGrid + Math.abs(cx), halfGrid + Math.abs(cz))

  if (aVal < 1e-8) {
    const normalX = -sinA
    const normalZ = cosA
    const sampleCount = 240
    const radius = maxRadius * 1.5
    const points: PointXZ[] = []
    for (let i = 0; i <= sampleCount; i++) {
      const t = ((i / sampleCount) * 2 - 1) * radius
      points.push({ x: cx + normalX * t, z: cz + normalZ * t })
    }
    return clipPolylineToGrid(points)
  }

  const b = Math.sqrt(c * c - aVal * aVal)
  const tMax = Math.asinh(Math.sqrt(Math.max(0, maxRadius * maxRadius - aVal * aVal)) / c)
  const sampleCount = Math.min(720, Math.max(160, Math.ceil(tMax * 80)))
  const branches: HyperbolaBranch[] = []
  for (const side of [-1, 1]) {
    const points: PointXZ[] = []
    for (let i = 0; i <= sampleCount; i++) {
      const t = (i / sampleCount) * 2 * tMax - tMax
      const x = side * aVal * Math.cosh(t)
      const y = b * Math.sinh(t)
      const rx = cx + x * cosA - y * sinA
      const rz = cz + x * sinA + y * cosA
      points.push({ x: rx, z: rz })
    }
    branches.push(...clipPolylineToGrid(points))
  }
  return branches
}


/** Build the fixed-phase loci that exist only for equal-frequency point sources. */
export function buildInterferenceBranches(
  source1: Vec2,
  source2: Vec2,
  wavelength1: number,
  wavelength2: number,
  phaseDiff: number,
  phaseOrder: 0 | 0.5,
): HyperbolaBranch[] {
  if (!hasEqualWavelengths(wavelength1, wavelength2)) return []

  const distance = Math.hypot(source2.x - source1.x, source2.z - source1.z)
  if (distance === 0) return []
  const phaseCycles = phaseDiff / (2 * Math.PI)
  const maxOrder = Math.ceil(distance / wavelength1 + Math.abs(phaseCycles) + 1)
  const result: HyperbolaBranch[] = []
  const seen = new Set<string>()

  for (let order = -maxOrder; order <= maxOrder; order++) {
    const pathDifference = (order + phaseOrder - phaseCycles) * wavelength1
    const aVal = Math.abs(pathDifference) / 2
    if (aVal >= distance / 2) continue
    const key = aVal.toFixed(6)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(...buildHyperbolaBranches(source1, source2, aVal))
  }
  return result
}
