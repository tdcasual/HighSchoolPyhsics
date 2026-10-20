import { micrometerReading } from '../../instruments/measuring/model'
import type { ViewPreset } from '../../instruments/measuring/pose'
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
  createMicrometerState,
  goToReading,
  indicatedOf,
  isMicrometerAnimating,
  newQuestion,
  resetMicrometerState,
  setGap,
  setZero,
  stepMotion,
  submitAnswer,
  type GapSource,
  type MicrometerState,
} from './state'

export type MicrometerSceneState = MicrometerState & {
  animating: boolean
  reveal: boolean
  /** 示数 = gap + zero error. */
  indicated: number
  readingText: string
  breakdownText: string
  setLesson: (lesson: LessonMode) => void
  setView: (view: ViewPreset) => void
  setHints: (hints: boolean) => void
  setShowLabels: (show: boolean) => void
  setFreeWork: (show: boolean) => void
  setAnswer: (answer: string) => void
  setGap: (value: number, source?: GapSource) => void
  setZero: (value: number) => void
  /** Turn the thimble by whole divisions (±1 = 0.01 mm). */
  nudge: (divisions: number) => void
  toggleLock: () => void
  toggleExplode: () => void
  goTo: (value: number) => void
  submit: () => void
  askQuestion: () => void
  reset: () => void
}

export function useMicrometerSceneState(): MicrometerSceneState {
  const { state, animating, commit, replace } = usePracticeState<MicrometerState>({
    pageId: 'micrometer',
    create: createMicrometerState,
    remembered: ['zero'],
    isAnimating: isMicrometerAnimating,
    stepMotion,
  })
  const indicated = indicatedOf(state)
  const reading = micrometerReading(indicated)

  return {
    ...state,
    animating,
    reveal: revealReading(state),
    indicated,
    readingText: `${reading.text} mm`,
    breakdownText: `固定 ${reading.fixed.toFixed(1)} mm + ${reading.divisions.toFixed(1)} × 0.01 mm`,
    setLesson: (lesson) => commit((current) => setLesson(current, lesson)),
    setView: (view) => commit((current) => setView(current, view)),
    setHints: (hints) => commit((current) => setHints(current, hints)),
    setShowLabels: (show) => commit((current) => setShowLabels(current, show)),
    setFreeWork: (show) => commit((current) => setFreeWork(current, show)),
    setAnswer: (answer) => commit((current) => setAnswer(current, answer)),
    setGap: (value, source) => commit((current) => setGap(current, value, source)),
    setZero: (value) => commit((current) => setZero(current, value)),
    nudge: (divisions) => commit((current) => setGap(current, current.position + divisions * 0.01, 'fine')),
    toggleLock: () => commit((current) => toggleLock(current, { locked: '锁紧装置已锁住测微螺杆。', unlocked: '锁紧装置已松开。' })),
    toggleExplode: () => commit((current) => toggleExplode(current, '螺旋测微器')),
    goTo: (value) => commit((current) => goToReading(current, value)),
    submit: () => commit(submitAnswer),
    askQuestion: () => commit((current) => newQuestion(current)),
    reset: () => replace(resetMicrometerState()),
  }
}
