import { caliperReading, type VernierDivisions } from '../../instruments/measuring/model'
import type { CaliperMeasure, ViewPreset } from '../../instruments/measuring/pose'
import {
  revealReading,
  setAnswer,
  setFreeWork,
  setHints,
  setLesson,
  setShowLabels,
  setView,
  toggleExplode,
  toggleLock,
  type LessonMode,
} from '../../instruments/measuring/practice'
import { usePracticeState } from '../../instruments/measuring/usePracticeState'
import {
  createCaliperState,
  goToReading,
  isCaliperAnimating,
  newQuestion,
  resetCaliperState,
  setDivisions,
  setMeasure,
  setPosition,
  stepMotion,
  submitAnswer,
  type CaliperState,
} from './state'

export type CaliperSceneState = CaliperState & {
  animating: boolean
  reveal: boolean
  /** One vernier division: the caliper's precision in mm. */
  precision: number
  readingText: string
  breakdownText: string
  setLesson: (lesson: LessonMode) => void
  setDivisions: (divisions: VernierDivisions) => void
  setMeasure: (measure: CaliperMeasure) => void
  setView: (view: ViewPreset) => void
  setHints: (hints: boolean) => void
  setShowLabels: (show: boolean) => void
  setFreeWork: (show: boolean) => void
  setAnswer: (answer: string) => void
  setPosition: (value: number) => void
  /** Move the frame by whole precisions (±1 = one vernier division). */
  nudge: (precisions: number) => void
  toggleLock: () => void
  toggleExplode: () => void
  goTo: (value: number) => void
  submit: () => void
  askQuestion: () => void
  reset: () => void
}

export function useCaliperSceneState(): CaliperSceneState {
  const { state, animating, commit, replace } = usePracticeState<CaliperState>({
    pageId: 'vernier-caliper',
    create: createCaliperState,
    remembered: ['divisions', 'measure'],
    isAnimating: isCaliperAnimating,
    stepMotion,
  })
  const reading = caliperReading(state.position, state.divisions)
  const precision = 1 / state.divisions

  return {
    ...state,
    animating,
    reveal: revealReading(state),
    precision,
    readingText: `${reading.text} mm`,
    breakdownText: `主尺 ${reading.main} mm + 第 ${reading.line} 条 × ${reading.precision} mm`,
    setLesson: (lesson) => commit((current) => setLesson(current, lesson)),
    setDivisions: (divisions) => commit((current) => setDivisions(current, divisions)),
    setMeasure: (measure) => commit((current) => setMeasure(current, measure)),
    setView: (view) => commit((current) => setView(current, view)),
    setHints: (hints) => commit((current) => setHints(current, hints)),
    setShowLabels: (show) => commit((current) => setShowLabels(current, show)),
    setFreeWork: (show) => commit((current) => setFreeWork(current, show)),
    setAnswer: (answer) => commit((current) => setAnswer(current, answer)),
    setPosition: (value) => commit((current) => setPosition(current, value)),
    nudge: (precisions) => commit((current) => setPosition(current, current.position + precisions / current.divisions)),
    toggleLock: () => commit((current) => toggleLock(current, { locked: '紧固螺钉已拧紧。', unlocked: '紧固螺钉已松开。' })),
    toggleExplode: () => commit((current) => toggleExplode(current, '游标卡尺')),
    goTo: (value) => commit((current) => goToReading(current, value)),
    submit: () => commit(submitAnswer),
    askQuestion: () => commit((current) => newQuestion(current)),
    reset: () => replace(resetCaliperState()),
  }
}
