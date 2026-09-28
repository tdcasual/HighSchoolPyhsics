import {
  CALIPER_RANGE_MM,
  MICROMETER_PITCH_MM,
  MICROMETER_RANGE_MM,
  caliperReading,
  checkCaliper,
  checkMicrometer,
  clamp,
  micrometerReading,
  quantizeMm,
  snapCaliper,
  type VernierDivisions,
} from './model'
import type { CaliperMeasure, InstrumentTool, ViewPreset } from './pose'

export const EXPLODE_SPEED = 2.2
export const CLICK_DECAY = 0.6

export type LessonMode = 'free' | 'read' | 'adjust'
export type GapSource = 'slider' | 'fine'

export type InstrumentAnim = {
  from: number
  to: number
  t: number
  dur: number
} | null

export type PracticeRecord = {
  kind: '读数' | '调节'
  spec: string
  input: string
  truth: string
  ok: boolean
}

export type MeasuringState = {
  tool: InstrumentTool
  lesson: LessonMode
  divisions: VernierDivisions
  measure: CaliperMeasure
  view: ViewPreset
  hints: boolean
  showLabels: boolean
  caliperX: number
  /** Fixed specimen size, independent of the instrument opening while measuring. */
  workSize: number
  caliperExplode: number
  caliperExplodeTarget: number
  caliperLocked: boolean
  caliperAnim: InstrumentAnim
  micGap: number
  micZero: number
  micExplode: number
  micExplodeTarget: number
  micLocked: boolean
  micAnim: InstrumentAnim
  micClick: number
  target: number | null
  /** True after a practice question is issued and until settings/question are reset. */
  challengeActive: boolean
  lastCheckAt: number | null
  answer: string
  feedback: string
  feedbackOk: boolean | null
  notice: string
  history: PracticeRecord[]
}

export function createMeasuringState(): MeasuringState {
  return {
    tool: 'caliper',
    lesson: 'free',
    divisions: 20,
    measure: 'outer',
    view: 'home',
    hints: true,
    showLabels: true,
    caliperX: 23.45,
    workSize: 23.45,
    caliperExplode: 0,
    caliperExplodeTarget: 0,
    caliperLocked: false,
    caliperAnim: null,
    micGap: 5.237,
    micZero: 0,
    micExplode: 0,
    micExplodeTarget: 0,
    micLocked: false,
    micAnim: null,
    micClick: 0,
    target: null,
    challengeActive: false,
    lastCheckAt: null,
    answer: '',
    feedback: '',
    feedbackOk: null,
    notice: '直接拖动尺框或微分筒，也可用滑块精确调节。输入目标读数后仪器会平滑移动。',
    history: [],
  }
}

export function easeInOutQuad(t: number): number {
  const clamped = clamp(t, 0, 1)
  return clamped < 0.5 ? 2 * clamped * clamped : 1 - (-2 * clamped + 2) ** 2 / 2
}

export function goToDuration(tool: InstrumentTool, distance: number): number {
  if (tool === 'caliper') return Math.min(1.4, 0.35 + Math.abs(distance) / 60)
  return Math.min(2, 0.4 + Math.abs(distance) / 8)
}

export function positionOf(state: MeasuringState): number {
  return state.tool === 'caliper' ? state.caliperX : state.micGap
}

export function shouldShowSpecimen(state: MeasuringState): boolean {
  return state.lesson === 'read' && state.challengeActive
}

export function indicatedOf(state: MeasuringState): number {
  return state.micGap + state.micZero
}

export function revealReading(state: MeasuringState): boolean {
  if (state.lesson === 'free') return state.hints
  return state.lastCheckAt !== null && Math.abs(state.lastCheckAt - positionOf(state)) < 1e-9
}

export function isAnimating(state: MeasuringState): boolean {
  return state.caliperAnim !== null
    || state.micAnim !== null
    || Math.abs(state.caliperExplode - state.caliperExplodeTarget) > 1e-3
    || Math.abs(state.micExplode - state.micExplodeTarget) > 1e-3
    || state.micClick > 0
}

function clearedPractice(state: MeasuringState): MeasuringState {
  return { ...state, lastCheckAt: null, feedback: '', feedbackOk: null }
}

export function setTool(state: MeasuringState, tool: InstrumentTool): MeasuringState {
  const workSize = state.lesson === 'read' ? (tool === 'caliper' ? state.caliperX : state.micGap) : state.workSize
  return clearedPractice({
    ...state,
    tool,
    workSize,
    challengeActive: false,
    target: null,
    answer: '',
    caliperAnim: null,
    micAnim: null,
    view: 'home',
    notice: tool === 'caliper' ? '已切换到游标卡尺。' : '已切换到螺旋测微器。',
  })
}

export function setLesson(state: MeasuringState, lesson: LessonMode): MeasuringState {
  return clearedPractice({
    ...state,
    lesson,
    workSize: lesson === 'read' ? positionOf(state) : state.workSize,
    challengeActive: false,
    target: null,
    answer: '',
    caliperAnim: null,
    micAnim: null,
    notice: lesson === 'free' ? '自由调节：刻度分解始终可打开。' : lesson === 'read' ? '读数练习：判定前不显示读数分解。' : '调节练习：把仪器调到目标示数。',
  })
}

export function setDivisions(state: MeasuringState, divisions: VernierDivisions): MeasuringState {
  if (state.challengeActive) return { ...state, notice: '本题设置已锁定；结束本题后才能更改分度。' }
  return clearedPractice({
    ...state,
    divisions,
    caliperX: snapCaliper(state.caliperX, divisions),
    caliperAnim: null,
    notice: `${divisions} 分度，精度 ${1 / divisions} mm。`,
  })
}

export function setMeasure(state: MeasuringState, measure: CaliperMeasure): MeasuringState {
  if (state.challengeActive) return { ...state, notice: '本题设置已锁定；结束本题后才能更改测量部位。' }
  const label = measure === 'outer' ? '外测量爪：测外径、厚度。' : measure === 'inner' ? '内测量爪：测内径、槽宽。' : '深度尺：测孔或槽的深度。'
  return clearedPractice({ ...state, measure, view: 'home', notice: `${label}三种测量共用同一套刻度。` })
}

export function setView(state: MeasuringState, view: ViewPreset): MeasuringState {
  return { ...state, view }
}

export function setHints(state: MeasuringState, hints: boolean): MeasuringState {
  return { ...state, hints }
}

export function setShowLabels(state: MeasuringState, showLabels: boolean): MeasuringState {
  return { ...state, showLabels }
}

export function setAnswer(state: MeasuringState, answer: string): MeasuringState {
  if (state.challengeActive && state.lastCheckAt !== null) return state
  return { ...state, answer }
}

export function setCaliperX(state: MeasuringState, value: number): MeasuringState {
  if (state.lesson === 'read') return { ...state, notice: '读数练习中仪器已固定；判定后或结束本题再调整。' }
  if (state.challengeActive && state.lastCheckAt !== null) return { ...state, notice: '本题已判定；出新题或结束本题后再调整。' }
  if (state.caliperLocked) {
    return { ...state, notice: '紧固螺钉已拧紧：先松开，才能移动尺框。' }
  }
  return clearedPractice({
    ...state,
    caliperX: quantizeMm(clamp(value, 0, CALIPER_RANGE_MM)),
    caliperAnim: null,
    notice: '尺框已移动。',
  })
}

export function setMicGap(state: MeasuringState, value: number, source: GapSource = 'slider'): MeasuringState {
  if (state.lesson === 'read') return { ...state, notice: '读数练习中仪器已固定；判定后或结束本题再调整。' }
  if (state.challengeActive && state.lastCheckAt !== null) return { ...state, notice: '本题已判定；出新题或结束本题后再调整。' }
  if (state.micLocked) {
    return { ...state, notice: '锁紧装置已锁定：先松开，才能转动旋钮。' }
  }
  const gap = quantizeMm(clamp(value, 0, MICROMETER_RANGE_MM))
  const clicked = gap <= 1e-9 && source === 'fine'
  return clearedPractice({
    ...state,
    micGap: gap,
    micAnim: null,
    micClick: clicked ? 1 : state.micClick,
    notice: clicked ? '喀喀——测微螺杆已与测砧接触。' : '微分筒已转动。',
  })
}

export function setMicZero(state: MeasuringState, zero: number): MeasuringState {
  if (state.lesson !== 'free') return { ...state, notice: '零点误差只在自由调节模式中设置；练习题会固定零点。' }
  return clearedPractice({
    ...state,
    micZero: quantizeMm(clamp(zero, -0.05, 0.05)),
    notice: '零点已改变。示数 = 间隙 + 零点。',
  })
}

export function toggleLock(state: MeasuringState): MeasuringState {
  if (state.lesson === 'read' && state.challengeActive) return { ...state, notice: '读数题的仪器和工件已固定。' }
  if (state.tool === 'caliper') {
    const caliperLocked = !state.caliperLocked
    return { ...state, caliperLocked, notice: caliperLocked ? '紧固螺钉已拧紧。' : '紧固螺钉已松开。' }
  }
  const micLocked = !state.micLocked
  return { ...state, micLocked, notice: micLocked ? '锁紧装置已锁住测微螺杆。' : '锁紧装置已松开。' }
}

export function toggleExplode(state: MeasuringState): MeasuringState {
  if (state.lesson === 'read' && state.challengeActive) return { ...state, notice: '读数题的视图已固定，请按当前刻度判读。' }
  if (state.tool === 'caliper') {
    const caliperExplodeTarget = state.caliperExplodeTarget > 0.5 ? 0 : 1
    return { ...state, caliperExplodeTarget, notice: caliperExplodeTarget ? '正在拆开游标卡尺。' : '正在合拢游标卡尺。' }
  }
  const micExplodeTarget = state.micExplodeTarget > 0.5 ? 0 : 1
  return { ...state, micExplodeTarget, notice: micExplodeTarget ? '正在拆开螺旋测微器。' : '正在合拢螺旋测微器。' }
}

export function goToReading(state: MeasuringState, raw: number): MeasuringState {
  if (state.lesson !== 'free') return { ...state, notice: '直接调到指定示数只在自由调节模式中可用。' }
  if (state.tool === 'caliper') {
    if (!(raw >= 0 && raw <= CALIPER_RANGE_MM)) {
      return { ...state, notice: '游标卡尺量程 0～150 mm。' }
    }
    if (state.caliperLocked) return { ...state, notice: '紧固螺钉已拧紧：先松开，才能移动尺框。' }
    const x = snapCaliper(raw, state.divisions)
    const snapped = Math.abs(x - raw) > 1e-9
    return clearedPractice({
      ...state,
      caliperAnim: { from: state.caliperX, to: x, t: 0, dur: goToDuration('caliper', x - state.caliperX) },
      notice: snapped
        ? `${state.divisions} 分度游标卡尺只能读到 ${(1 / state.divisions).toFixed(2)} mm 的整数倍，已调到最接近的 ${x.toFixed(state.divisions === 10 ? 1 : 2)} mm。`
        : `尺框移动到 ${x.toFixed(state.divisions === 10 ? 1 : 2)} mm。观察游标零线和对齐的刻度线。`,
    })
  }
  const reading = Math.round(raw * 1000) / 1000
  const gap = reading - state.micZero
  if (!(gap >= 0 && gap <= MICROMETER_RANGE_MM)) {
    return { ...state, notice: `螺旋测微器量程 0～25 mm${state.micZero ? '（有零点误差时示数范围相应平移）' : ''}。` }
  }
  if (state.micLocked) return { ...state, notice: '锁紧装置已锁定：先松开，才能转动旋钮。' }
  const turns = Math.abs(gap - state.micGap) / MICROMETER_PITCH_MM
  return clearedPractice({
    ...state,
    micAnim: { from: state.micGap, to: gap, t: 0, dur: goToDuration('micrometer', gap - state.micGap) },
    notice: `微分筒转动约 ${turns.toFixed(1)} 圈，示数调到 ${reading.toFixed(3)} mm。`,
  })
}

function advanceAnim(anim: InstrumentAnim, dt: number): { anim: InstrumentAnim; value: number | null } {
  if (!anim) return { anim: null, value: null }
  const t = Math.min(1, anim.t + dt / anim.dur)
  const eased = easeInOutQuad(t)
  const value = t >= 1 ? anim.to : anim.from + (anim.to - anim.from) * eased
  return { anim: t >= 1 ? null : { ...anim, t }, value }
}

function approach(current: number, target: number, dt: number): number {
  if (Math.abs(target - current) <= 1e-3) return target
  return current + Math.sign(target - current) * Math.min(Math.abs(target - current), dt * EXPLODE_SPEED)
}

export function stepMotion(state: MeasuringState, dt: number): MeasuringState {
  const caliperExplode = approach(state.caliperExplode, state.caliperExplodeTarget, dt)
  const micExplode = approach(state.micExplode, state.micExplodeTarget, dt)
  const caliperStep = advanceAnim(state.caliperAnim, dt)
  const micStep = advanceAnim(state.micAnim, dt)
  return {
    ...state,
    caliperExplode,
    micExplode,
    caliperAnim: caliperStep.anim,
    caliperX: caliperStep.value === null ? state.caliperX : quantizeMm(caliperStep.value),
    micAnim: micStep.anim,
    micGap: micStep.value === null ? state.micGap : quantizeMm(micStep.value),
    micClick: Math.max(0, state.micClick - dt * CLICK_DECAY),
  }
}

function pushHistory(state: MeasuringState, row: PracticeRecord): PracticeRecord[] {
  const history = [...state.history, row]
  return history.length > 40 ? history.slice(history.length - 40) : history
}

export function submitAnswer(state: MeasuringState): MeasuringState {
  if (state.lesson === 'free') return { ...state, notice: '自由调节不用判定。' }
  if (!state.challengeActive) return { ...state, notice: '请先出题，再提交答案或检查调节。' }
  if (state.lastCheckAt !== null) return { ...state, notice: '本题已判定；请出新题继续练习。' }
  if (state.lesson === 'read') {
    if (state.tool === 'caliper') {
      const result = checkCaliper(state.answer, state.caliperX, state.divisions)
      const truth = result.truth as ReturnType<typeof caliperReading>
      const feedback = `${result.ok ? '✓ 正确！' : `✗ 正确读数是 ${truth.text} mm。`} 主尺 ${truth.main} mm + 第 ${truth.line} 条 × ${truth.precision} mm。${result.notes.join('')}`
      return {
        ...state,
        lastCheckAt: state.caliperX,
        feedback,
        feedbackOk: result.ok,
        history: pushHistory(state, { kind: '读数', spec: `${state.divisions} 分度`, input: state.answer || '（空）', truth: truth.text, ok: result.ok }),
        notice: result.ok ? '读数正确。' : '再看游标零线和对齐的刻度。',
      }
    }
    const indicated = indicatedOf(state)
    const result = checkMicrometer(state.answer, indicated)
    const truth = result.truth as ReturnType<typeof micrometerReading>
    const zero = state.micZero
      ? ` 零点 ${state.micZero > 0 ? '+' : ''}${state.micZero.toFixed(3)} mm，物体实际长度 = 示数 − 零点 = ${(truth.value - state.micZero).toFixed(3)} mm。`
      : ''
    const feedback = `${result.ok ? '✓ 正确！' : `✗ 参考读数 ${truth.text} mm。`} 固定刻度 ${truth.fixed.toFixed(1)} mm + ${truth.divisions.toFixed(1)} 格 × 0.01 mm。${result.notes.join('')}${zero}`
    return {
      ...state,
      lastCheckAt: state.micGap,
      feedback,
      feedbackOk: result.ok,
      history: pushHistory(state, { kind: '读数', spec: '0.01 mm', input: state.answer || '（空）', truth: truth.text, ok: result.ok }),
      notice: result.ok ? '读数正确。' : '核对半毫米刻度和可动刻度。',
    }
  }

  if (state.target === null) return newQuestion(state)
  if (state.tool === 'caliper') {
    const reading = caliperReading(state.caliperX, state.divisions)
    const want = state.target.toFixed(state.divisions === 10 ? 1 : 2)
    const ok = Math.abs(reading.value - state.target) < 0.5 / state.divisions
    const feedback = ok
      ? `✓ 调对了！当前读数 ${reading.text} mm。`
      : `✗ 当前读数是 ${reading.text} mm，目标 ${want} mm，${Number(reading.text) < Number(want) ? '还要再拉开尺框' : '调过头了，往回推尺框'}。`
    return {
      ...state,
      lastCheckAt: state.caliperX,
      feedback,
      feedbackOk: ok,
      history: pushHistory(state, { kind: '调节', spec: `${state.divisions} 分度`, input: reading.text, truth: want, ok }),
      notice: feedback,
    }
  }
  const indicated = indicatedOf(state)
  const reading = micrometerReading(indicated)
  const want = state.target.toFixed(3)
  const ok = Math.abs(indicated - state.target) <= 0.0015
  const feedback = ok
    ? `✓ 调对了！当前读数 ${reading.text} mm。`
    : `✗ 当前读数是 ${reading.text} mm，目标 ${want} mm，${Number(reading.text) < Number(want) ? '还要再旋出一些' : '调过头了，往回旋进'}。`
  return {
    ...state,
    lastCheckAt: state.micGap,
    feedback,
    feedbackOk: ok,
    history: pushHistory(state, { kind: '调节', spec: '0.01 mm', input: reading.text, truth: want, ok }),
    notice: feedback,
  }
}

export function randomCaliperReading(mode: CaliperMeasure, n: VernierDivisions, current: number, rng: () => number): number {
  const ranges = { outer: [3, 120], inner: [8, 60], depth: [4, 60] } as const
  const [start, end] = ranges[mode]
  let next = current
  for (let attempt = 0; attempt < 8; attempt += 1) {
    next = Math.round((start + rng() * (end - start)) * n) / n
    if (Math.abs(next - current) >= 0.5) break
  }
  return next
}

export function randomMicrometerReading(rng: () => number): number {
  if (rng() < 0.35) {
    const base = Math.floor(rng() * 40) * 0.5
    const edge = rng() < 0.5 ? 0.47 + rng() * 0.025 : 0.005 + rng() * 0.02
    return Math.round((base + edge) * 1000) / 1000
  }
  return Math.round((0.3 + rng() * 20) * 1000) / 1000
}

function reachableMicrometerReading(zero: number, rng: () => number): number {
  // Keep a visible, positive specimen and ensure the target can be reached with this zero error.
  const minimum = Math.max(0.25, zero + 0.25)
  return quantizeMm(Math.max(randomMicrometerReading(rng), minimum))
}

export function newQuestion(state: MeasuringState, rng: () => number = Math.random): MeasuringState {
  if (state.lesson === 'free') return { ...state, notice: '先切换到读数练习或调节练习。' }
  if (state.lesson === 'read') {
    if (state.tool === 'caliper') {
      const caliperX = randomCaliperReading(state.measure, state.divisions, state.caliperX, rng)
      return clearedPractice({
        ...state,
        caliperX,
        workSize: caliperX,
        challengeActive: true,
        caliperAnim: null,
        caliperLocked: false,
        answer: '',
        target: null,
        notice: '新工件已夹好：读出游标卡尺的读数，输入后点“判定”。',
      })
    }
    const reading = reachableMicrometerReading(state.micZero, rng)
    const micGap = quantizeMm(Math.max(0, reading - state.micZero))
    return clearedPractice({
      ...state,
      micGap,
      workSize: micGap,
      challengeActive: true,
      micAnim: null,
      micLocked: false,
      answer: '',
      target: null,
      notice: `新工件已夹好：读出螺旋测微器的示数（读到 0.001 mm）。${state.micZero ? '注意零点误差。' : ''}`,
    })
  }
  const target = state.tool === 'caliper'
    ? randomCaliperReading(state.measure, state.divisions, state.caliperX, rng)
    : reachableMicrometerReading(state.micZero, rng)
  const digits = state.tool === 'caliper' ? (state.divisions === 10 ? 1 : 2) : 3
  return clearedPractice({
    ...state,
    target,
    challengeActive: true,
    caliperAnim: null,
    micAnim: null,
    caliperLocked: false,
    micLocked: false,
    answer: '',
    notice: `请把${state.tool === 'caliper' ? '游标卡尺' : '螺旋测微器'}调到 ${target.toFixed(digits)} mm，然后点“检查”。`,
  })
}

export function resetMeasuringState(): MeasuringState {
  return { ...createMeasuringState(), notice: '已回到初始示数，并合拢仪器。' }
}
