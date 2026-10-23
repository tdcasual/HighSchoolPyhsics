import {
  CALIPER_RANGE_MM,
  caliperReading,
  checkCaliper,
  snapCaliper,
  type VernierDivisions,
} from '../../instruments/measuring/model'
import type { CaliperMeasure } from '../../instruments/measuring/pose'
import {
  adjustBlockedNotice,
  animateTo,
  clearedPractice,
  createPracticeState,
  isPracticeAnimating,
  startQuestion,
  stepPracticeMotion,
  type PracticeState,
} from '../../instruments/measuring/practice'

/** Vernier-caliper scene state; `position` is the frame reading in mm. */
export type CaliperState = PracticeState & {
  divisions: VernierDivisions
  measure: CaliperMeasure
}

const LOCKED_NOTICE = '紧固螺钉已拧紧：先松开，才能移动尺框。'

export function createCaliperState(): CaliperState {
  return {
    ...createPracticeState(
      23.45,
      '拖动尺框移动游标；播放面板的 ± 按钮、方向键或「.」键每次调一个精度。输入目标读数后尺框会平滑移动。',
    ),
    divisions: 20,
    measure: 'outer',
  }
}

export const isCaliperAnimating = isPracticeAnimating

export const MEASURE_LABELS: Record<CaliperMeasure, string> = { outer: '外径', inner: '内径', depth: '深度' }

export function digitsFor(divisions: VernierDivisions): number {
  return divisions === 10 ? 1 : 2
}

export function setDivisions(state: CaliperState, divisions: VernierDivisions): CaliperState {
  if (state.challengeActive) return { ...state, notice: '本题设置已锁定；结束本题后才能更改分度。' }
  return clearedPractice({
    ...state,
    divisions,
    position: snapCaliper(state.position, divisions),
    anim: null,
    notice: `${divisions} 分度，精度 ${1 / divisions} mm。`,
  })
}

export function setMeasure(state: CaliperState, measure: CaliperMeasure): CaliperState {
  if (state.challengeActive) return { ...state, notice: '本题设置已锁定；结束本题后才能更改测量部位。' }
  const label =
    measure === 'outer'
      ? '外测量爪：测外径、厚度。'
      : measure === 'inner'
        ? '内测量爪：测内径、槽宽。'
        : '深度尺：测孔或槽的深度。'
  return clearedPractice({ ...state, measure, view: 'home', notice: `${label}三种测量共用同一套刻度。` })
}

export function setPosition(state: CaliperState, value: number): CaliperState {
  const blocked = adjustBlockedNotice(state, LOCKED_NOTICE)
  if (blocked) return { ...state, notice: blocked }
  return clearedPractice({
    ...state,
    // A vernier only resolves 1/n mm; snapping keeps exactly one vernier line aligned.
    position: snapCaliper(value, state.divisions),
    anim: null,
    notice: '尺框已移动。',
  })
}

export function goToReading(state: CaliperState, raw: number): CaliperState {
  if (state.lesson !== 'free') return { ...state, notice: '直接调到指定示数只在自由调节模式中可用。' }
  if (!(raw >= 0 && raw <= CALIPER_RANGE_MM)) return { ...state, notice: '游标卡尺量程 0～150 mm。' }
  if (state.locked) return { ...state, notice: LOCKED_NOTICE }
  const x = snapCaliper(raw, state.divisions)
  const text = x.toFixed(digitsFor(state.divisions))
  return animateTo(
    state,
    'caliper',
    x,
    Math.abs(x - raw) > 1e-9
      ? `${state.divisions} 分度游标卡尺只能读到 ${(1 / state.divisions).toFixed(2)} mm 的整数倍，已调到最接近的 ${text} mm。`
      : `尺框移动到 ${text} mm。观察游标零线和对齐的刻度线。`,
  )
}

export const stepMotion = (state: CaliperState, dt: number): CaliperState => stepPracticeMotion(state, dt)

export function submitAnswer(state: CaliperState): CaliperState {
  if (state.lesson === 'free') return { ...state, notice: '自由调节不用判定。' }
  if (!state.challengeActive) return { ...state, notice: '请先出题，再提交答案或检查调节。' }
  if (state.lastCheckAt !== null) return { ...state, notice: '本题已判定；请出新题继续练习。' }
  if (state.lesson === 'read') {
    const result = checkCaliper(state.answer, state.position, state.divisions)
    const truth = result.truth as ReturnType<typeof caliperReading>
    return {
      ...state,
      lastCheckAt: state.position,
      feedback: `${result.ok ? '✓ 正确！' : `✗ 正确读数是 ${truth.text} mm。`} 主尺 ${truth.main} mm + 第 ${truth.line} 条 × ${truth.precision} mm。${result.notes.join('')}`,
      feedbackOk: result.ok,
      notice: result.ok ? '读数正确。' : '再看游标零线和对齐的刻度。',
    }
  }
  if (state.target === null) return newQuestion(state)
  const reading = caliperReading(state.position, state.divisions)
  const want = state.target.toFixed(digitsFor(state.divisions))
  const ok = Math.abs(reading.value - state.target) < 0.5 / state.divisions
  const feedback = ok
    ? `✓ 调对了！当前读数 ${reading.text} mm。`
    : `✗ 当前读数是 ${reading.text} mm，目标 ${want} mm，${Number(reading.text) < Number(want) ? '还要再拉开尺框' : '调过头了，往回推尺框'}。`
  return { ...state, lastCheckAt: state.position, feedback, feedbackOk: ok, notice: feedback }
}

export function randomCaliperReading(
  mode: CaliperMeasure,
  n: VernierDivisions,
  current: number,
  rng: () => number,
): number {
  const ranges = { outer: [3, 120], inner: [8, 60], depth: [4, 60] } as const
  const [start, end] = ranges[mode]
  let next = current
  for (let attempt = 0; attempt < 8; attempt += 1) {
    next = Math.round((start + rng() * (end - start)) * n) / n
    if (Math.abs(next - current) >= 0.5) break
  }
  return next
}

export function newQuestion(state: CaliperState, rng: () => number = Math.random): CaliperState {
  if (state.lesson === 'free') return { ...state, notice: '先切换到读数练习或调节练习。' }
  const value = randomCaliperReading(state.measure, state.divisions, state.position, rng)
  if (state.lesson === 'read') {
    return startQuestion(state, {
      position: value,
      workSize: value,
      target: null,
      notice: '新工件已夹好：读出游标卡尺的读数，输入后点“判定”。',
    })
  }
  return startQuestion(state, {
    target: value,
    notice: `请把游标卡尺调到 ${value.toFixed(digitsFor(state.divisions))} mm，然后点“检查”。`,
  })
}

export function resetCaliperState(): CaliperState {
  return { ...createCaliperState(), notice: '已回到初始示数，并合拢仪器。' }
}
