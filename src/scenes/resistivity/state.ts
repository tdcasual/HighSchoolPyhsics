import { easeInOutQuad, goToDuration } from '../../instruments/measuring/practice'
import {
  differential,
  element,
  fitLine,
  fitOrigin,
  measurement,
  meterReading,
  nearestMaterial,
  resistivityFrom,
  systematicError,
  wire,
  type CircuitControl,
  type CircuitMethod,
  type ElementKind,
  type MaterialKey,
  type MeterKey,
} from './model'

export type ResistivityStage = 'diameter' | 'circuit' | 'analysis' | 'iv'
export type GraphKind = 'UI' | 'Rl'
export type FitKind = 'origin' | 'line'

export type DiameterRecord = { d: number; reading: number; zero: number; source: string } | null

export type DataRecord = {
  wire: string
  wireName: string
  method: CircuitMethod
  control: CircuitControl
  ammeter: MeterKey
  voltmeter: MeterKey
  l: number
  U: number
  I: number
  source: string
}

export type GapAnim = { from: number; to: number; t: number; dur: number } | null

export type ResistivityState = {
  stage: ResistivityStage
  view: 'home' | 'front' | 'top' | 'focus'
  material: MaterialKey
  mystery: boolean
  nominal: number
  position: 0 | 1 | 2
  gap: number
  zero: number
  gapAnim: GapAnim
  diameters: [DiameterRecord, DiameterRecord, DiameterRecord]
  step: number
  method: CircuitMethod
  control: CircuitControl
  ammeter: MeterKey
  voltmeter: MeterKey
  closed: boolean
  slider: number
  lengthCm: number
  records: DataRecord[]
  graph: GraphKind
  fit: FitKind
  element: ElementKind
  voltage: number
  notice: string
}

export function createResistivityState(): ResistivityState {
  return {
    stage: 'diameter',
    view: 'home',
    material: 'nichrome',
    mystery: false,
    nominal: 0.4,
    position: 0,
    gap: 1.2,
    zero: 0,
    gapAnim: null,
    diameters: [null, null, null],
    step: 0,
    method: 'external',
    control: 'limit',
    ammeter: 'A06',
    voltmeter: 'V3',
    closed: false,
    slider: 1,
    lengthCm: 50,
    records: [],
    graph: 'UI',
    fit: 'origin',
    element: 'lamp',
    voltage: 1,
    notice: '在金属丝三个位置用螺旋测微器测直径，取平均后再接通电路。',
  }
}

export function activeMaterial(state: ResistivityState): MaterialKey {
  return state.mystery ? 'constantan' : state.material
}

export function activeWire(state: ResistivityState) {
  return wire(activeMaterial(state), state.nominal)
}

export function wireLabel(state: ResistivityState): string {
  return state.mystery ? '未知金属丝' : activeWire(state).name
}

export function isAnimating(state: ResistivityState): boolean {
  return state.gapAnim !== null
}

export function indicatedGap(state: ResistivityState): number {
  return state.gap + state.zero
}

export function isSeated(state: ResistivityState): boolean {
  return Math.abs(state.gap - activeWire(state).positions[state.position]) <= 0.0005
}

export function seatOnWire(state: ResistivityState): ResistivityState {
  const target = activeWire(state).positions[state.position]
  return {
    ...state,
    gapAnim: { from: state.gap, to: target, t: 0, dur: goToDuration('micrometer', target - state.gap) },
    notice: `测微螺杆正在靠近位置 ${state.position + 1} 的金属丝。`,
  }
}

export function stepGap(state: ResistivityState, dt: number): ResistivityState {
  if (!state.gapAnim) return state
  const t = Math.min(1, state.gapAnim.t + dt / state.gapAnim.dur)
  const value = t >= 1
    ? state.gapAnim.to
    : state.gapAnim.from + (state.gapAnim.to - state.gapAnim.from) * easeInOutQuad(t)
  return {
    ...state,
    gap: Math.round(value * 1e6) / 1e6,
    gapAnim: t >= 1 ? null : { ...state.gapAnim, t },
    notice: t >= 1 ? `已与位置 ${state.position + 1} 的金属丝接触，读数稳定。` : state.notice,
  }
}

export function setGap(state: ResistivityState, gap: number): ResistivityState {
  return { ...state, gap: Math.round(Math.max(0, Math.min(25, gap)) * 1e6) / 1e6, gapAnim: null }
}

export function recordDiameter(state: ResistivityState): ResistivityState {
  if (!isSeated(state)) {
    return { ...state, notice: '测微螺杆还没有与金属丝接触，不能记录。' }
  }
  const diameter = Math.round((indicatedGap(state) - state.zero) * 1000) / 1000
  const diameters = [...state.diameters] as ResistivityState['diameters']
  diameters[state.position] = { d: diameter, reading: indicatedGap(state), zero: state.zero, source: '测量' }
  const done = diameters.every(Boolean)
  return {
    ...state,
    diameters,
    notice: `已记录位置 ${state.position + 1}：d = ${diameter.toFixed(3)} mm。${done ? '三个位置已测完，可以作图求电阻率。' : '换一个位置继续测量。'}`,
  }
}

export function meanDiameter(state: ResistivityState): number | null {
  const measured = state.diameters.filter((item): item is NonNullable<DiameterRecord> => item !== null)
  if (measured.length === 0) return null
  return measured.reduce((sum, item) => sum + item.d, 0) / measured.length
}

export function liveMeasurement(state: ResistivityState) {
  const sample = activeWire(state)
  return measurement({
    material: sample.key,
    diameter: meanDiameter(state) ?? sample.diameter,
    length: state.lengthCm / 100,
    ammeter: state.ammeter === 'A3' ? 'A3' : 'A06',
    voltmeter: state.voltmeter === 'V15' ? 'V15' : 'V3',
    control: state.control,
    method: state.method,
    slider: state.slider,
    closed: state.closed && state.step >= 2,
    voltmeterConnected: state.step >= 2,
  })
}

export function safeSlider(control: CircuitControl): number {
  return control === 'limit' ? 1 : 0
}

export function setClosed(state: ResistivityState, closed: boolean): ResistivityState {
  if (closed && state.step < 2) {
    return { ...state, closed: false, notice: '测量回路尚未完成：先接通主回路和电压表。' }
  }
  const unsafe = Math.abs(state.slider - safeSlider(state.control)) > 0.05
  if (closed && unsafe) {
    return {
      ...state,
      closed: false,
      notice: state.control === 'limit'
        ? '滑片未在 b 端最大阻值处，已保持开关断开；先移到安全端再闭合。'
        : '滑片未在 a 端零电压处，已保持开关断开；先移到安全端再闭合。',
    }
  }
  return {
    ...state,
    closed,
    notice: closed ? '开关已闭合。调节滑片后记录，读数后断开。' : '开关已断开。',
  }
}

export function recordPoint(state: ResistivityState): ResistivityState {
  if (state.step < 2) return { ...state, notice: '先完成主回路和电压表连接。' }
  const reading = liveMeasurement(state)
  if (!reading.closed) return { ...state, notice: '开关断开，电路中没有电流。' }
  const current = meterReading(reading.Imeter, state.ammeter === 'A3' ? 'A3' : 'A06')
  const voltage = meterReading(reading.Umeter, state.voltmeter === 'V15' ? 'V15' : 'V3')
  if (current.over || voltage.over) return { ...state, notice: '电表超量程：换大量程或把滑片调向安全端。' }
  if (current.reading <= 0 || voltage.reading <= 0) return { ...state, notice: '电流或电压为零，换一个滑片位置再记录。' }
  const sample = activeWire(state)
  const row: DataRecord = {
    wire: `${sample.key}@${state.nominal}`,
    wireName: wireLabel(state),
    method: state.method,
    control: state.control,
    ammeter: state.ammeter,
    voltmeter: state.voltmeter,
    l: state.lengthCm,
    U: voltage.reading,
    I: current.reading,
    source: '测量',
  }
  return {
    ...state,
    records: [...state.records, row],
    notice: `已记录第 ${state.records.length + 1} 组：U = ${voltage.text} V，I = ${current.text} A。`,
  }
}

export function groupsOf(records: DataRecord[]) {
  if (records.length === 0) return { ui: [] as DataRecord[], rl: [] as Array<{ l: number; R: number }>, last: null as DataRecord | null }
  const last = records[records.length - 1]
  const same = records.filter((row) => row.method === last.method
    && row.control === last.control
    && row.ammeter === last.ammeter
    && row.voltmeter === last.voltmeter
    && row.wire === last.wire)
  const ui = same.filter((row) => Math.abs(row.l - last.l) < 1e-9)
  const byLength = new Map<string, DataRecord[]>()
  for (const row of same) {
    const key = row.l.toFixed(1)
    const bucket = byLength.get(key) ?? []
    bucket.push(row)
    byLength.set(key, bucket)
  }
  const rl = [...byLength.entries()]
    .map(([key, rows]) => ({ l: Number(key), R: rows.reduce((sum, row) => sum + row.U / row.I, 0) / rows.length }))
    .sort((a, b) => a.l - b.l)
  return { ui, rl, last }
}

export function analysisOf(state: ResistivityState) {
  const grouped = groupsOf(state.records)
  const diameter = meanDiameter(state)
  const points = state.graph === 'UI'
    ? grouped.ui.map((row) => [row.I, row.U] as [number, number])
    : grouped.rl.map((row) => [row.l / 100, row.R] as [number, number])
  const fit = points.length >= 2 ? (state.fit === 'origin' ? fitOrigin(points) : fitLine(points)) : null
  const diameterCount = state.diameters.filter(Boolean).length
  const diameterComplete = diameterCount === 3
  let rho: number | null = null
  let resistance: number | null = null
  if (fit && state.graph === 'UI' && grouped.last && diameter && diameterComplete) {
    resistance = fit.slope
    rho = resistivityFrom(fit.slope, diameter, grouped.last.l / 100)
  }
  if (fit && state.graph === 'Rl' && diameter && diameterComplete) {
    rho = fit.slope * (Math.PI * (diameter * 1e-3) ** 2 / 4)
  }
  return {
    points,
    fit,
    rho,
    resistance,
    diameter,
    count: diameterCount,
    diameterCount,
    diameterComplete,
    nearest: rho ? nearestMaterial(rho) : null,
    truth: MATERIALS_RHO(activeMaterial(state)),
    grouped,
  }
}

function MATERIALS_RHO(key: MaterialKey) {
  return wire(key, 0.4).rho
}

export function fillSamples(state: ResistivityState): ResistivityState {
  const sample = activeWire(state)
  const diameters = state.diameters.map((item, index) => item ?? {
    d: sample.positions[index],
    reading: sample.positions[index] + state.zero,
    zero: state.zero,
    source: '示例',
  }) as ResistivityState['diameters']
  const sliders = state.control === 'limit' ? [1, 0.78, 0.6, 0.46, 0.34, 0.22] : [0.12, 0.24, 0.36, 0.5, 0.66, 0.82]
  const draft: ResistivityState = { ...state, diameters, step: 2, closed: true }
  const rows = [...state.records]
  const push = (lengthCm: number, slider: number) => {
    const reading = liveMeasurement({ ...draft, lengthCm, slider, records: rows })
    const current = meterReading(reading.Imeter, draft.ammeter === 'A3' ? 'A3' : 'A06')
    const voltage = meterReading(reading.Umeter, draft.voltmeter === 'V15' ? 'V15' : 'V3')
    if (current.over || voltage.over || current.reading <= 0 || voltage.reading <= 0) return
    rows.push({
      wire: `${sample.key}@${state.nominal}`,
      wireName: wireLabel(state),
      method: state.method,
      control: state.control,
      ammeter: state.ammeter,
      voltmeter: state.voltmeter,
      l: lengthCm,
      U: voltage.reading,
      I: current.reading,
      source: '示例',
    })
  }
  sliders.forEach((slider) => push(state.lengthCm, slider))
  ;[20, 30, 40, 50].forEach((lengthCm) => push(lengthCm, state.control === 'limit' ? 0.5 : 0.5))
  return { ...state, diameters, records: rows, notice: '已补上示例直径和几组 U、I，表格里标为示例。' }
}


export function liveElement(state: ResistivityState) {
  const value = element(state.element, state.voltage)
  return { ...value, slope: differential(state.element, state.voltage) }
}

export function errorOf(state: ResistivityState) {
  const sample = activeWire(state)
  const resistance = sample.rho * (state.lengthCm / 100) / (Math.PI * (sample.diameter * 1e-3) ** 2 / 4)
  return systematicError(resistance, state.method, state.ammeter === 'A3' ? 'A3' : 'A06', state.voltmeter === 'V15' ? 'V15' : 'V3')
}
