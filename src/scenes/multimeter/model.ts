export const GALVANOMETER = { Ig: 1e-3, Rg: 30 }

export function seriesResistor(voltage: number, galvanometer = GALVANOMETER): number {
  return voltage / galvanometer.Ig - galvanometer.Rg
}

export function shuntResistor(current: number, galvanometer = GALVANOMETER): number {
  return galvanometer.Ig * galvanometer.Rg / (current - galvanometer.Ig)
}

export function galvanometerCurrent(kind: 'V' | 'A', applied: number, resistance: number, galvanometer = GALVANOMETER): number {
  if (kind === 'V') return applied / (galvanometer.Rg + resistance)
  return applied * resistance / (galvanometer.Rg + resistance)
}

export function convertedMeter(kind: 'V' | 'A', resistance: number, galvanometer = GALVANOMETER) {
  if (kind === 'V') return { range: galvanometer.Ig * (galvanometer.Rg + resistance), resistance: galvanometer.Rg + resistance }
  return { range: galvanometer.Ig * (galvanometer.Rg + resistance) / resistance, resistance: galvanometer.Rg * resistance / (galvanometer.Rg + resistance) }
}

export function voltAmmeter(input: { Rx: number; RA: number; RV: number; E: number; Rs: number }) {
  const { Rx, RA, RV, E, Rs } = input
  const parallel = Rx * RV / (Rx + RV)
  const externalCurrent = E / (Rs + RA + parallel)
  const externalVoltage = externalCurrent * parallel
  const internalCurrent = E / (Rs + RA + Rx)
  const internalVoltage = internalCurrent * (RA + Rx)
  const external = { U: externalVoltage, I: externalCurrent, R: externalVoltage / externalCurrent, error: 0 }
  const internal = { U: internalVoltage, I: internalCurrent, R: internalVoltage / internalCurrent, error: 0 }
  external.error = (external.R - Rx) / Rx
  internal.error = (internal.R - Rx) / Rx
  return {
    external,
    internal,
    critical: Math.sqrt(RA * RV),
    better: Math.abs(external.error) <= Math.abs(internal.error) ? 'external' as const : 'internal' as const,
  }
}

export function trialContact(input: { Rx: number; RA: number; RV: number; E: number; Rs: number }) {
  const result = voltAmmeter(input)
  const dU = Math.abs(result.internal.U - result.external.U) / result.external.U
  const dI = Math.abs(result.internal.I - result.external.I) / result.external.I
  return {
    dU,
    dI,
    choose: dU > dI ? 'external' as const : 'internal' as const,
    reason: dU > dI ? '电压表示数变化明显，电流表分压影响大，用外接法。' : '电流表示数变化明显，电压表分流影响大，用内接法。',
  }
}

export function rheostat(input: { E: number; r: number; R0: number; Rx: number; s: number }) {
  const { E, r, R0, Rx } = input
  const slider = Math.max(0, Math.min(1, input.s))
  const limitResistance = slider * R0
  const limitCurrent = E / (r + limitResistance + Rx)
  const limitVoltage = limitCurrent * Rx
  const lower = slider * R0
  const upper = (1 - slider) * R0
  const parallel = lower > 0 ? lower * Rx / (lower + Rx) : 0
  const total = r + upper + parallel
  const supply = E / total
  const dividerVoltage = supply * parallel
  const dividerCurrent = dividerVoltage / Rx
  return {
    limit: { U: limitVoltage, I: limitCurrent },
    divider: { U: dividerVoltage, I: dividerCurrent },
    limitRange: [E * Rx / (r + R0 + Rx), E * Rx / (r + Rx)] as [number, number],
    dividerRange: [0, E * Rx * R0 / (R0 + Rx) / (r + R0 * Rx / (R0 + Rx))] as [number, number],
  }
}

export type RangeKey = 'OFF' | 'V2.5' | 'V10' | 'V50' | 'mA10' | 'mA100' | 'R1' | 'R10' | 'R100' | 'R1k' | 'AC250'
export type RangeKind = 'off' | 'V' | 'mA' | 'ohm' | 'AC'

export type RangeSpec = {
  key: RangeKey
  kind: RangeKind
  label: string
  full?: number
  scale?: number
  mult?: number
  resistance?: number
}

export const RANGES: RangeSpec[] = [
  { key: 'OFF', kind: 'off', label: 'OFF' },
  { key: 'V2.5', kind: 'V', full: 2.5, scale: 250, label: '直流 2.5 V' },
  { key: 'V10', kind: 'V', full: 10, scale: 10, label: '直流 10 V' },
  { key: 'V50', kind: 'V', full: 50, scale: 50, label: '直流 50 V' },
  { key: 'mA10', kind: 'mA', full: 0.01, scale: 10, label: '直流 10 mA', resistance: 25 },
  { key: 'mA100', kind: 'mA', full: 0.1, scale: 10, label: '直流 100 mA', resistance: 2.5 },
  { key: 'R1', kind: 'ohm', mult: 1, label: '欧姆 ×1' },
  { key: 'R10', kind: 'ohm', mult: 10, label: '欧姆 ×10' },
  { key: 'R100', kind: 'ohm', mult: 100, label: '欧姆 ×100' },
  { key: 'R1k', kind: 'ohm', mult: 1000, label: '欧姆 ×1k' },
  { key: 'AC250', kind: 'AC', full: 250, scale: 250, label: '交流 250 V' },
]

export const RANGE = Object.fromEntries(RANGES.map((range) => [range.key, range])) as Record<RangeKey, RangeSpec>

export const OHM = { E: 1.5, mid: 15 }
export const V_SENSITIVITY = 20000
const DIODE = { Is: 2.5e-9, nVt: 0.045 }
export const BOARD = { cell: { E: 1.5, r: 0.6 }, loop: { E: 3, R: 470 }, resistors: [22, 150, 2200, 47000] }

export function ohmFraction(resistance: number, multiplier: number, zeroFactor = 1): number {
  const internal = OHM.mid * multiplier
  return zeroFactor * internal / (internal + resistance)
}

export function ohmFromFraction(fraction: number, multiplier: number): number {
  const internal = OHM.mid * multiplier
  return fraction <= 0 ? Number.POSITIVE_INFINITY : internal * (1 / fraction - 1)
}

export function meterResistance(range: RangeSpec): number {
  if (range.kind === 'V' && range.full) return V_SENSITIVITY * range.full
  if (range.kind === 'mA') return range.resistance ?? Number.POSITIVE_INFINITY
  if (range.kind === 'ohm') return OHM.mid * (range.mult ?? 1)
  return Number.POSITIVE_INFINITY
}

export function diodeOhmCurrent(internalResistance: number, emf: number): number {
  let low = 0
  let high = emf / internalResistance
  for (let step = 0; step < 80; step += 1) {
    const current = (low + high) / 2
    const balance = current * internalResistance + DIODE.nVt * Math.log(1 + current / DIODE.Is) - emf
    if (balance > 0) high = current
    else low = current
  }
  return (low + high) / 2
}

export type MeasureTarget = 'none' | 'cell' | 'loopV' | 'loopI' | 'resistor' | 'short' | 'diode'

export type MeasureInput = {
  range: RangeKey
  target: MeasureTarget
  resistance?: number
  swapped?: boolean
  diodeForward?: boolean
  mechanical?: number
  ohmZero?: number
}

export type MeasureResult = {
  fraction: number
  truth: number | null
  unit: string
  warning: string
  damage: boolean
}

export function measure(input: MeasureInput): MeasureResult {
  const range = RANGE[input.range]
  const sign = input.swapped ? -1 : 1
  const zeroFactor = input.ohmZero ?? 1
  const result: MeasureResult = { fraction: input.mechanical ?? 0, truth: null, unit: '', warning: '', damage: false }
  if (range.kind === 'off') {
    result.warning = '选择开关在 OFF 挡，电表不工作。'
    return result
  }
  if (input.target === 'cell' || input.target === 'loopV') {
    const emf = input.target === 'cell' ? BOARD.cell.E : BOARD.loop.E
    const sourceResistance = input.target === 'cell' ? BOARD.cell.r : BOARD.loop.R
    if (range.kind === 'V' && range.full) {
      const resistance = meterResistance(range)
      const voltage = emf * resistance / (resistance + sourceResistance)
      result.fraction += sign * voltage / range.full
      result.truth = voltage
      result.unit = 'V'
    } else if (range.kind === 'mA' && range.full) {
      const current = emf / (sourceResistance + (range.resistance ?? 0))
      result.fraction += sign * current / range.full
      result.damage = current > range.full * 1.5
      result.warning = '电流挡直接接在电源两端，相当于短路：电流过大会烧坏电表。'
    } else if (range.kind === 'ohm') {
      result.fraction += sign * (emf / (OHM.mid * (range.mult ?? 1))) * 3
      result.damage = true
      result.warning = '不能用欧姆挡测带电的电路或电源。'
    } else {
      result.warning = '直流电源应使用直流电压挡。'
    }
  } else if (input.target === 'loopI') {
    if (range.kind === 'mA' && range.full) {
      const current = BOARD.loop.E / (BOARD.loop.R + (range.resistance ?? 0))
      result.fraction += sign * current / range.full
      result.truth = current * 1000
      result.unit = 'mA'
    } else if (range.kind === 'V' && range.full) {
      const resistance = meterResistance(range)
      const voltage = BOARD.loop.E * resistance / (resistance + BOARD.loop.R)
      result.fraction += sign * voltage / range.full
      result.warning = '电压表串联在电路中，示数接近电源电压。测电流要用电流挡。'
    } else if (range.kind === 'ohm') {
      result.fraction += sign * 0.8
      result.damage = true
      result.warning = '不能用欧姆挡测通电电路中的电流。'
    } else {
      result.warning = '测直流电流应使用直流电流挡。'
    }
  } else if (input.target === 'resistor' || input.target === 'short') {
    const resistance = input.target === 'short' ? 0 : input.resistance ?? 0
    if (range.kind === 'ohm') {
      result.fraction += ohmFraction(resistance, range.mult ?? 1, zeroFactor)
      result.truth = resistance
      result.unit = 'Ω'
    } else {
      result.warning = '测电阻要用欧姆挡。'
    }
  } else if (input.target === 'diode' && range.kind === 'ohm') {
    const internal = OHM.mid * (range.mult ?? 1)
    const forward = input.diodeForward !== false
    const current = forward ? diodeOhmCurrent(internal, OHM.E) : DIODE.Is
    const fraction = zeroFactor * current * internal / OHM.E
    result.fraction += fraction
    result.truth = ohmFromFraction(current * internal / OHM.E, range.mult ?? 1)
    result.unit = 'Ω'
  } else if (input.target === 'diode') {
    result.warning = '判断二极管的极性要用欧姆挡。'
  }
  return result
}

export function bestOhmRange(resistance: number): RangeKey {
  let best: { key: RangeKey; score: number } | null = null
  for (const range of RANGES) {
    if (range.kind !== 'ohm' || !range.mult) continue
    const fraction = ohmFraction(resistance, range.mult)
    const score = Math.abs(Math.log(fraction / (1 - fraction)))
    if (!best || score < best.score) best = { key: range.key, score }
  }
  return best?.key ?? 'R10'
}
