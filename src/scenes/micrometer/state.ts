import {
  MICROMETER_PITCH_MM,
  MICROMETER_RANGE_MM,
  checkMicrometer,
  clamp,
  micrometerReading,
  quantizeMm,
} from '../../instruments/measuring/model'
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

export const CLICK_DECAY = 0.6

/** How the gap was changed: the ratchet only clicks when the spindle is turned onto the anvil. */
export type GapSource = 'slider' | 'fine'

/** Micrometer scene state; `position` is the physical gap between anvil and spindle in mm. */
export type MicrometerState = PracticeState & {
  /** Zero error: the reading shown with the jaws closed. 示数 = 间隙 + 零点. */
  zero: number
  /** Ratchet click indicator, decays from 1 after the spindle meets the anvil. */
  click: number
}

const LOCKED_NOTICE = '锁紧装置已锁定：先松开，才能转动旋钮。'

export function createMicrometerState(): MicrometerState {
  return {
    ...createPracticeState(5.237, '上下拖微分筒表面可转动它（转一圈前进 0.5 mm），沿轴向拖可快速移动。播放面板的 ± 按钮、方向键或「.」键每次调一格。'),
    zero: 0,
    click: 0,
  }
}

/** Zero error as shown on screen: "+0.020 mm". */
export function formatZero(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)} mm`
}

export function indicatedOf(state: MicrometerState): number {
  return state.position + state.zero
}

export function isMicrometerAnimating(state: MicrometerState): boolean {
  return isPracticeAnimating(state) || state.click > 0
}

export function setGap(state: MicrometerState, value: number, source: GapSource = 'slider'): MicrometerState {
  const blocked = adjustBlockedNotice(state, LOCKED_NOTICE)
  if (blocked) return { ...state, notice: blocked }
  // The estimated digit is 0.001 mm, so finer positions would only produce unreadable states.
  const gap = quantizeMm(Math.round(clamp(value, 0, MICROMETER_RANGE_MM) * 1000) / 1000)
  const clicked = gap <= 1e-9 && source === 'fine'
  return clearedPractice({
    ...state,
    position: gap,
    anim: null,
    click: clicked ? 1 : state.click,
    notice: clicked ? '喀喀——测微螺杆已与测砧接触。' : '微分筒已转动。',
  })
}

export function setZero(state: MicrometerState, zero: number): MicrometerState {
  if (state.lesson !== 'free') return { ...state, notice: '零点误差只在自由调节模式中设置；练习题会固定零点。' }
  return clearedPractice({
    ...state,
    zero: quantizeMm(clamp(zero, -0.05, 0.05)),
    notice: '零点已改变。示数 = 间隙 + 零点。',
  })
}

export function goToReading(state: MicrometerState, raw: number): MicrometerState {
  if (state.lesson !== 'free') return { ...state, notice: '直接调到指定示数只在自由调节模式中可用。' }
  const reading = Math.round(raw * 1000) / 1000
  const gap = reading - state.zero
  if (!(gap >= 0 && gap <= MICROMETER_RANGE_MM)) {
    return { ...state, notice: `螺旋测微器量程 0～25 mm${state.zero ? '（有零点误差时示数范围相应平移）' : ''}。` }
  }
  if (state.locked) return { ...state, notice: LOCKED_NOTICE }
  const turns = Math.abs(gap - state.position) / MICROMETER_PITCH_MM
  return animateTo(state, 'micrometer', gap, `微分筒转动约 ${turns.toFixed(1)} 圈，示数调到 ${reading.toFixed(3)} mm。`)
}

export function stepMotion(state: MicrometerState, dt: number): MicrometerState {
  return { ...stepPracticeMotion(state, dt), click: Math.max(0, state.click - dt * CLICK_DECAY) }
}

export function submitAnswer(state: MicrometerState): MicrometerState {
  if (state.lesson === 'free') return { ...state, notice: '自由调节不用判定。' }
  if (!state.challengeActive) return { ...state, notice: '请先出题，再提交答案或检查调节。' }
  if (state.lastCheckAt !== null) return { ...state, notice: '本题已判定；请出新题继续练习。' }
  const indicated = indicatedOf(state)
  if (state.lesson === 'read') {
    const result = checkMicrometer(state.answer, indicated)
    const truth = result.truth as ReturnType<typeof micrometerReading>
    const zero = state.zero
      ? ` 零点 ${state.zero > 0 ? '+' : ''}${state.zero.toFixed(3)} mm，物体实际长度 = 示数 − 零点 = ${(truth.value - state.zero).toFixed(3)} mm。`
      : ''
    return {
      ...state,
      lastCheckAt: state.position,
      feedback: `${result.ok ? '✓ 正确！' : `✗ 参考读数 ${truth.text} mm。`} 固定刻度 ${truth.fixed.toFixed(1)} mm + ${truth.divisions.toFixed(1)} 格 × 0.01 mm。${result.notes.join('')}${zero}`,
      feedbackOk: result.ok,
      notice: result.ok ? '读数正确。' : '核对半毫米刻度和可动刻度。',
    }
  }
  if (state.target === null) return newQuestion(state)
  const reading = micrometerReading(indicated)
  const want = state.target.toFixed(3)
  const ok = Math.abs(indicated - state.target) <= 0.0015
  const feedback = ok
    ? `✓ 调对了！当前读数 ${reading.text} mm。`
    : `✗ 当前读数是 ${reading.text} mm，目标 ${want} mm，${Number(reading.text) < Number(want) ? '还要再旋出一些' : '调过头了，往回旋进'}。`
  return { ...state, lastCheckAt: state.position, feedback, feedbackOk: ok, notice: feedback }
}

export function randomMicrometerReading(rng: () => number): number {
  // About a third of the questions sit next to a half-millimetre line, the classic trap.
  if (rng() < 0.35) {
    const base = Math.floor(rng() * 40) * 0.5
    const edge = rng() < 0.5 ? 0.47 + rng() * 0.025 : 0.005 + rng() * 0.02
    return Math.round((base + edge) * 1000) / 1000
  }
  return Math.round((0.3 + rng() * 20) * 1000) / 1000
}

function reachableReading(zero: number, rng: () => number): number {
  // Keep a visible, positive specimen and ensure the target can be reached with this zero error.
  const minimum = Math.max(0.25, zero + 0.25)
  return quantizeMm(Math.max(randomMicrometerReading(rng), minimum))
}

export function newQuestion(state: MicrometerState, rng: () => number = Math.random): MicrometerState {
  if (state.lesson === 'free') return { ...state, notice: '先切换到读数练习或调节练习。' }
  const reading = reachableReading(state.zero, rng)
  if (state.lesson === 'read') {
    const gap = quantizeMm(Math.max(0, reading - state.zero))
    return startQuestion(state, {
      position: gap,
      workSize: gap,
      target: null,
      notice: `新工件已夹好：读出螺旋测微器的示数（读到 0.001 mm）。${state.zero ? '注意零点误差。' : ''}`,
    })
  }
  return startQuestion(state, {
    target: reading,
    notice: `请把螺旋测微器调到 ${reading.toFixed(3)} mm，然后点“检查”。`,
  })
}

export function resetMicrometerState(): MicrometerState {
  return { ...createMicrometerState(), notice: '已回到初始示数，并合拢仪器。' }
}
