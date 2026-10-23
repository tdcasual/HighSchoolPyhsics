import {
  bestOhmRange,
  galvanometerCurrent,
  measure,
  RANGE,
  rheostat,
  seriesResistor,
  shuntResistor,
  voltAmmeter,
  type MeasureTarget,
  type RangeKey,
} from './model'

export type MeterStage = 'convert' | 'va' | 'rheostat' | 'use'
export type UseTask = 'V' | 'I' | 'R' | 'D' | 'Z'
export type ContactMethod = 'external' | 'internal'
export type RheostatMode = 'limit' | 'divider'

export type MultimeterState = {
  stage: MeterStage
  view: 'home' | 'front' | 'top' | 'focus'
  convKind: 'V' | 'A'
  convRange: number
  convResistance: number | null
  convTest: number
  lgRx: number
  ammeterResistance: number
  voltmeterResistance: number
  contactMethod: ContactMethod
  slider: number
  rheostatMode: RheostatMode
  rheostatClosed: boolean
  loadResistance: number
  rheostatResistance: number
  range: RangeKey
  task: UseTask
  swapped: boolean
  mechanical: number
  mechanicalOffset: number
  ohmKnob: number
  ohmBase: number
  resistance: number
  notice: string
}

export function createMultimeterState(): MultimeterState {
  return {
    stage: 'use',
    view: 'home',
    convKind: 'V',
    convRange: 3,
    convResistance: null,
    convTest: 0.6,
    lgRx: 1.3,
    ammeterResistance: 1,
    voltmeterResistance: 3000,
    contactMethod: 'external',
    slider: 0.3,
    rheostatMode: 'divider',
    rheostatClosed: false,
    loadResistance: 20,
    rheostatResistance: 50,
    range: 'V2.5',
    task: 'V',
    swapped: false,
    mechanical: 0,
    mechanicalOffset: 0.028,
    ohmKnob: 0,
    ohmBase: 0.95,
    resistance: 150,
    notice: '红表笔接干电池正极。先看 2.5 V 挡的指针，再用机械调零把空载指针拨回 0。',
  }
}

const TASK_TARGET: Record<UseTask, MeasureTarget> = {
  V: 'cell',
  I: 'loopI',
  R: 'resistor',
  D: 'diode',
  Z: 'short',
}

export function taskTarget(task: UseTask): MeasureTarget {
  return TASK_TARGET[task]
}

export function mechanicalOffset(state: MultimeterState): number {
  return state.mechanicalOffset + state.mechanical / 100
}

export function ohmZeroFactor(state: MultimeterState): number {
  if (RANGE[state.range].kind !== 'ohm') return 1
  return state.ohmBase * (1 + state.ohmKnob / 100)
}

export function readingOf(state: MultimeterState) {
  return measure({
    range: state.range,
    target: taskTarget(state.task),
    resistance: state.resistance,
    swapped: state.swapped,
    diodeForward: !state.swapped,
    mechanical: mechanicalOffset(state),
    ohmZero: ohmZeroFactor(state),
  })
}

export function displayFraction(state: MultimeterState): number {
  if (state.stage === 'use') return readingOf(state).fraction
  const zeroOffset = mechanicalOffset(state)
  if (state.stage === 'convert') {
    if (state.convResistance === null) return zeroOffset
    const applied = state.convTest * state.convRange
    return galvanometerCurrent(state.convKind, applied, state.convResistance) / 1e-3 + zeroOffset
  }
  const voltageRange = RANGE[state.range].kind === 'V' ? (RANGE[state.range].full ?? 10) : 10
  if (state.stage === 'rheostat') {
    const result = rheostat({ E: 3, r: 0.5, R0: state.rheostatResistance, Rx: state.loadResistance, s: state.slider })
    const output = state.rheostatMode === 'limit' ? result.limit.U : result.divider.U
    return (state.rheostatClosed ? output / voltageRange : 0) + zeroOffset
  }
  const comparison = voltAmmeter({
    Rx: 10 ** state.lgRx,
    RA: state.ammeterResistance,
    RV: state.voltmeterResistance,
    E: 3,
    Rs: 10,
  })
  const voltage = state.contactMethod === 'external' ? comparison.external.U : comparison.internal.U
  return voltage / voltageRange + zeroOffset
}

export function selectRheostatMode(state: MultimeterState, mode: RheostatMode): MultimeterState {
  return {
    ...state,
    rheostatMode: mode,
    rheostatClosed: false,
    notice: `已切换为${mode === 'limit' ? '限流式' : '分压式'}并断开开关；先将滑片移到${mode === 'limit' ? 'b 端' : 'a 端'}再闭合。`,
  }
}

export function parkRheostat(state: MultimeterState): MultimeterState {
  return {
    ...state,
    slider: state.rheostatMode === 'limit' ? 1 : 0,
    rheostatClosed: false,
    notice: `滑片已移至${state.rheostatMode === 'limit' ? 'b 端，最大串联电阻' : 'a 端，输出 0 V'}；可以闭合开关。`,
  }
}

export function toggleRheostat(state: MultimeterState): MultimeterState {
  if (state.rheostatClosed) return { ...state, rheostatClosed: false, notice: '滑变电路已断开。' }
  const safePosition = state.rheostatMode === 'limit' ? 1 : 0
  if (Math.abs(state.slider - safePosition) > 0.005) {
    return {
      ...state,
      notice: `闭合前先将滑片移到${state.rheostatMode === 'limit' ? 'b 端（最大串联电阻）' : 'a 端（输出 0 V）'}。`,
    }
  }
  return { ...state, rheostatClosed: true, notice: '滑变电路已闭合；现在可以缓慢移动滑片。' }
}

export function requiredConversion(state: MultimeterState): number {
  return state.convKind === 'V' ? seriesResistor(state.convRange) : shuntResistor(state.convRange)
}

export function connectConversion(state: MultimeterState): MultimeterState {
  const resistance = requiredConversion(state)
  return {
    ...state,
    convResistance: resistance,
    notice: `已接入 ${resistance.toFixed(2)} Ω。表头偏转等于当前校准比例，比例为 1 时满偏。`,
  }
}

export function zeroMechanical(state: MultimeterState): MultimeterState {
  return { ...state, mechanical: -state.mechanicalOffset * 100, notice: '机械调零完成：空载指针对准左端 0。' }
}

export function zeroOhm(state: MultimeterState): MultimeterState {
  if (RANGE[state.range].kind !== 'ohm') return { ...state, notice: '欧姆调零只在欧姆挡使用。' }
  if (state.task !== 'Z') return { ...state, notice: '先选择“短接”，让红黑表笔接触，再进行欧姆调零。' }
  if (!isMechanicallyZero(state)) return { ...state, notice: '先完成机械调零，再短接表笔进行欧姆调零。' }
  const knob = 100 * (1 / state.ohmBase - 1)
  return { ...state, ohmKnob: knob, notice: '红黑表笔短接，欧姆调零完成，指针在右端 0 Ω。' }
}

export function chooseOhmRange(state: MultimeterState): MultimeterState {
  if (state.task !== 'R') return { ...state, notice: '选择电阻测量后再使用“合适倍率”。' }
  const range = bestOhmRange(state.resistance)
  return { ...state, range, ohmKnob: 0, task: 'R', notice: `已换到 ${RANGE[range].label}。换挡后要重新欧姆调零。` }
}

export function isMechanicallyZero(state: MultimeterState): boolean {
  return Math.abs(mechanicalOffset(state)) < 0.003
}

export function isOhmZero(state: MultimeterState): boolean {
  return Math.abs(ohmZeroFactor(state) - 1) < 0.004
}
