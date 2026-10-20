import { clamp, quantizeMm } from './model'
import type { InstrumentTool, ViewPreset } from './pose'

/**
 * Lesson flow shared by the vernier-caliper and micrometer scenes: free adjustment, reading
 * practice and adjustment practice, locking, exploding, eased moves to a commanded reading.
 * Each scene's state extends PracticeState with its own instrument fields and keeps the
 * instrument position (caliper frame / micrometer gap) in `position`.
 */

export const EXPLODE_SPEED = 2.2

export type LessonMode = 'free' | 'read' | 'adjust'

export type InstrumentAnim = {
  from: number
  to: number
  t: number
  dur: number
} | null

export type PracticeState = {
  lesson: LessonMode
  view: ViewPreset
  /** The view before a practice run zoomed to the scales; restored when the run ends. */
  viewBeforePractice: ViewPreset | null
  hints: boolean
  showLabels: boolean
  /** 自由调节: show a workpiece held by the instrument (its size follows the opening). */
  freeWork: boolean
  /** Caliper frame reading or micrometer gap, in mm. */
  position: number
  /** Fixed specimen size for a reading question. */
  workSize: number
  explode: number
  explodeTarget: number
  locked: boolean
  anim: InstrumentAnim
  target: number | null
  /** True after a practice question is issued and until settings/question are reset. */
  challengeActive: boolean
  lastCheckAt: number | null
  answer: string
  feedback: string
  feedbackOk: boolean | null
  notice: string
}

export function createPracticeState(position: number, notice: string): PracticeState {
  return {
    lesson: 'free',
    view: 'home',
    viewBeforePractice: null,
    hints: true,
    showLabels: true,
    freeWork: false,
    position,
    workSize: position,
    explode: 0,
    explodeTarget: 0,
    locked: false,
    anim: null,
    target: null,
    challengeActive: false,
    lastCheckAt: null,
    answer: '',
    feedback: '',
    feedbackOk: null,
    notice,
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

export function clearedPractice<S extends PracticeState>(state: S): S {
  return { ...state, lastCheckAt: null, feedback: '', feedbackOk: null }
}

/** Ends a practice run: back to the view the teacher had before it zoomed to the scales. */
export function endPracticeView(state: PracticeState): Pick<PracticeState, 'view' | 'viewBeforePractice'> {
  return { view: state.viewBeforePractice ?? state.view, viewBeforePractice: null }
}

/**
 * Starts (or continues) a practice run. The whole-instrument view is too small to read the
 * scales at classroom distance, so questions open on the scale close-up.
 */
export function practiceView(state: PracticeState): Pick<PracticeState, 'view' | 'viewBeforePractice'> {
  if (state.challengeActive) return { view: state.view, viewBeforePractice: state.viewBeforePractice }
  return { view: 'focus', viewBeforePractice: state.view }
}

export function shouldShowSpecimen(state: PracticeState): boolean {
  return (state.lesson === 'read' && state.challengeActive) || (state.lesson === 'free' && state.freeWork)
}

/** The specimen size: fixed for a reading question, held by the instrument in free adjustment. */
export function specimenSize(state: PracticeState): number {
  return state.lesson === 'free' ? state.position : state.workSize
}

export function revealReading(state: PracticeState): boolean {
  if (state.lesson === 'free') return state.hints
  return state.lastCheckAt !== null && Math.abs(state.lastCheckAt - state.position) < 1e-9
}

export function isPracticeAnimating(state: PracticeState): boolean {
  return state.anim !== null || Math.abs(state.explode - state.explodeTarget) > 1e-3
}

/** Why the instrument may not be moved right now, or null when it may. */
export function adjustBlockedNotice(state: PracticeState, lockedNotice: string): string | null {
  if (state.lesson === 'read') return '读数练习中仪器已固定；判定后或结束本题再调整。'
  if (state.challengeActive && state.lastCheckAt !== null) return '本题已判定；出新题或结束本题后再调整。'
  if (state.locked) return lockedNotice
  return null
}

export function setLesson<S extends PracticeState>(state: S, lesson: LessonMode): S {
  return clearedPractice({
    ...state,
    lesson,
    workSize: lesson === 'read' ? state.position : state.workSize,
    challengeActive: false,
    ...endPracticeView(state),
    target: null,
    answer: '',
    anim: null,
    notice: lesson === 'free' ? '自由调节：刻度分解始终可打开。' : lesson === 'read' ? '读数练习：判定前不显示读数分解。' : '调节练习：把仪器调到目标示数。',
  })
}

export function setView<S extends PracticeState>(state: S, view: ViewPreset): S {
  return { ...state, view }
}

export function setHints<S extends PracticeState>(state: S, hints: boolean): S {
  return { ...state, hints }
}

export function setShowLabels<S extends PracticeState>(state: S, showLabels: boolean): S {
  return { ...state, showLabels }
}

export function setFreeWork<S extends PracticeState>(state: S, freeWork: boolean): S {
  return { ...state, freeWork }
}

export function setAnswer<S extends PracticeState>(state: S, answer: string): S {
  if (state.challengeActive && state.lastCheckAt !== null) return state
  return { ...state, answer }
}

export function toggleLock<S extends PracticeState>(state: S, notices: { locked: string; unlocked: string }): S {
  if (state.lesson === 'read' && state.challengeActive) return { ...state, notice: '读数题的仪器和工件已固定。' }
  const locked = !state.locked
  return { ...state, locked, notice: locked ? notices.locked : notices.unlocked }
}

export function toggleExplode<S extends PracticeState>(state: S, name: string): S {
  if (state.lesson === 'read' && state.challengeActive) return { ...state, notice: '读数题的视图已固定，请按当前刻度判读。' }
  const explodeTarget = state.explodeTarget > 0.5 ? 0 : 1
  return { ...state, explodeTarget, notice: explodeTarget ? `正在拆开${name}。` : `正在合拢${name}。` }
}

/** Starts an eased move of the instrument to `to` mm. */
export function animateTo<S extends PracticeState>(state: S, tool: InstrumentTool, to: number, notice: string): S {
  return clearedPractice({
    ...state,
    anim: { from: state.position, to, t: 0, dur: goToDuration(tool, to - state.position) },
    notice,
  })
}

function approach(current: number, target: number, dt: number): number {
  if (Math.abs(target - current) <= 1e-3) return target
  return current + Math.sign(target - current) * Math.min(Math.abs(target - current), dt * EXPLODE_SPEED)
}

/** Advances explode and any commanded move by `dt` seconds. */
export function stepPracticeMotion<S extends PracticeState>(state: S, dt: number): S {
  const explode = approach(state.explode, state.explodeTarget, dt)
  if (!state.anim) return { ...state, explode }
  const t = Math.min(1, state.anim.t + dt / state.anim.dur)
  const position = t >= 1 ? state.anim.to : state.anim.from + (state.anim.to - state.anim.from) * easeInOutQuad(t)
  return { ...state, explode, anim: t >= 1 ? null : { ...state.anim, t }, position: quantizeMm(position) }
}

/** Issues a practice question; `patch` carries the instrument-specific setup. */
export function startQuestion<S extends PracticeState>(state: S, patch: Partial<S>): S {
  return clearedPractice({
    ...state,
    challengeActive: true,
    ...practiceView(state),
    anim: null,
    locked: false,
    answer: '',
    ...patch,
  })
}

export function resetPracticeFields<S extends PracticeState>(fresh: S): S {
  return { ...fresh, notice: '已回到初始示数，并合拢仪器。' }
}

/** Step-button label: "+0.05", "−10". */
export function signedStep(delta: number, digits: number) {
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta).toFixed(digits)}`
}
