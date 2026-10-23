/** Readings transcribed from the open measuring-tools lab (millimetres). */

const EPS = 1e-9

export const VERNIER_SPANS = { 10: 9, 20: 19, 50: 49 } as const
export type VernierDivisions = keyof typeof VERNIER_SPANS

export const MICROMETER_PITCH_MM = 0.5
export const MICROMETER_LEAST_MM = 0.01
export const MICROMETER_RANGE_MM = 25
export const CALIPER_RANGE_MM = 150
/** The main scale runs past the 150 mm range so the last vernier line (49 mm on a 50-division vernier) still meets a graduation. */
export const MAIN_SCALE_END_MM = 200

export type ParsedReading = { value: number; decimals: number; text: string }

export function roundTo(value: number, step: number): number {
  return Math.round(value / step + (value >= 0 ? EPS : -EPS)) * step
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function decimalsOf(text: string): number {
  const matched = text.trim().match(/\.(\d+)$/)
  return matched ? matched[1].length : 0
}

export function parseReading(text: string | null | undefined): ParsedReading | null {
  const raw = String(text ?? '')
    .trim()
    .replace(/[，,]/g, '.')
    .replace(/\s*mm$/i, '')
    .replace(/^−/, '-')
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null
  return { value: Number(raw), decimals: decimalsOf(raw), text: raw }
}

export type VernierSpec = {
  n: VernierDivisions
  span: number
  spacing: number
  precision: number
  decimals: number
}

export function vernier(n: VernierDivisions): VernierSpec {
  const span = VERNIER_SPANS[n]
  return { n, span, spacing: span / n, precision: 1 / n, decimals: n === 10 ? 1 : 2 }
}

export type CaliperReading = VernierSpec & {
  x: number
  main: number
  line: number
  value: number
  text: string
  offsets: number[]
}

export function caliperReading(x: number, n: VernierDivisions): CaliperReading {
  const spec = vernier(n)
  const value = Math.round(x * n + EPS) / n
  let main = Math.floor(value + EPS)
  let line = Math.round((value - main) * n)
  if (line >= n) {
    main += 1
    line -= n
  }
  const offsets: number[] = []
  for (let j = 0; j <= n; j += 1) {
    const position = x + j * spec.spacing
    offsets.push(position - Math.round(position))
  }
  return { ...spec, x, main, line, value, text: value.toFixed(spec.decimals), offsets }
}

export type CheckResult = {
  ok: boolean
  valueOk?: boolean
  formatOk?: boolean
  truth: CaliperReading | MicrometerReading
  input?: number
  notes: string[]
}

export function checkCaliper(input: string, x: number, n: VernierDivisions): CheckResult {
  const spec = vernier(n)
  const truth = caliperReading(x, n)
  const parsed = parseReading(input)
  const notes: string[] = []
  if (!parsed) {
    return { ok: false, truth, notes: [`请输入以 mm 为单位的数字，例如 ${truth.text}。`] }
  }
  const valueOk = Math.abs(parsed.value - truth.value) < spec.precision / 2 - 1e-7
  let formatOk = parsed.decimals === spec.decimals
  if (formatOk && n === 20) formatOk = /[05]$/.test(parsed.text)
  if (formatOk && n === 50) formatOk = /[02468]$/.test(parsed.text)
  if (!valueOk) {
    if (Math.abs(parsed.value - truth.main) < 1e-7) notes.push('只读了主尺整毫米数，还要加上对齐游标线的读数。')
    else if (Math.abs(parsed.value - (truth.main + truth.line * spec.spacing)) < 1e-4 && truth.line) {
      notes.push(`游标每格长 ${spec.spacing} mm，但读数应乘精度 ${spec.precision} mm。`)
    } else if (Math.abs(parsed.value - truth.value) < 1.01) notes.push('主尺读数应看游标零刻度线左侧最近的整毫米刻度。')
    else notes.push('先看游标零线读主尺，再找与主尺刻度对齐的游标线。')
  }
  if (parsed.decimals > spec.decimals)
    notes.push(`游标卡尺不估读：${n} 分度读到 ${spec.precision} mm，保留 ${spec.decimals} 位小数。`)
  else if (valueOk && !formatOk) notes.push(`${n} 分度精度为 ${spec.precision} mm，读数应写成 ${truth.text} mm。`)
  return { ok: valueOk && formatOk, valueOk, formatOk, truth, input: parsed.value, notes }
}

export type MicrometerReading = {
  r: number
  fixed: number
  divisions: number
  halfLine: boolean
  value: number
  text: string
}

export function micrometerReading(r: number): MicrometerReading {
  // Negative zero error is a small reading before the fixed-scale zero mark, not a
  // fictitious negative 0.5 mm sleeve line. Keep it as a signed thimble offset.
  const half = r < 0 ? 0 : Math.floor(r / MICROMETER_PITCH_MM + 1e-7)
  const fixed = half * MICROMETER_PITCH_MM
  const divisions = (r - fixed) / MICROMETER_LEAST_MM
  const value = roundTo(r, 0.001)
  const normalized = Object.is(value, -0) ? 0 : value
  return { r, fixed, divisions, halfLine: r >= 0 && half % 2 !== 0, value: normalized, text: normalized.toFixed(3) }
}

export function checkMicrometer(input: string, r: number): CheckResult {
  const truth = micrometerReading(r)
  const parsed = parseReading(input)
  const notes: string[] = []
  if (!parsed) {
    return { ok: false, truth, notes: [`请输入以 mm 为单位的数字，例如 ${truth.text}。`] }
  }
  const diff = parsed.value - truth.value
  const valueOk = Math.abs(diff) <= 0.0005 + 1e-9
  const formatOk = parsed.decimals === 3
  if (!valueOk) {
    if (Math.abs(Math.abs(diff) - 0.5) <= 0.002 + 1e-9)
      notes.push('半毫米刻度线判断有误：看固定刻度下方的半毫米线是否已经露出。')
    else if (Math.abs(diff) < 0.03) notes.push('可动刻度对齐格数读错；每格 0.01 mm，再估读十分之一格。')
    else notes.push('读数 = 固定刻度（含半毫米）+ 可动刻度格数 × 0.01 mm。')
  }
  if (parsed.decimals < 3) notes.push(`螺旋测微器要估读到 0.001 mm，末位的 0 也要写出，例如 ${truth.text} mm。`)
  if (parsed.decimals > 3) notes.push('只估读到 0.001 mm 一位即可。')
  return { ok: valueOk && formatOk, valueOk, formatOk, truth, input: parsed.value, notes }
}

export function snapCaliper(value: number, n: VernierDivisions): number {
  return Math.round(clamp(value, 0, CALIPER_RANGE_MM) * n) / n
}

export function quantizeMm(value: number): number {
  return Math.round(value * 1e6) / 1e6
}
