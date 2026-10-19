import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { useEffect, useMemo, useRef, useState } from 'react'
import { caliperReading, micrometerReading } from './model'
import {
  createMeasuringState,
  goToReading,
  indicatedOf,
  isAnimating,
  newQuestion,
  resetMeasuringState,
  revealReading,
  setAnswer,
  setCaliperX,
  setDivisions,
  setHints,
  setLesson,
  setMeasure,
  setMicGap,
  setMicZero,
  setShowLabels,
  setTool,
  setView,
  stepMotion,
  submitAnswer,
  toggleExplode,
  toggleLock,
  type GapSource,
  type LessonMode,
  type MeasuringState,
} from './state'
import type { CaliperMeasure, ViewPreset } from './pose'
import type { VernierDivisions } from './model'

export type MeasuringToolsSceneState = MeasuringState & {
  animating: boolean
  reveal: boolean
  readingText: string
  breakdownText: string
  lockLabel: string
  explodeLabel: string
  exploded: boolean
  setTool: (tool: MeasuringState['tool']) => void
  setLesson: (lesson: LessonMode) => void
  setDivisions: (divisions: VernierDivisions) => void
  setMeasure: (measure: CaliperMeasure) => void
  setView: (view: ViewPreset) => void
  setHints: (hints: boolean) => void
  setShowLabels: (showLabels: boolean) => void
  setAnswer: (answer: string) => void
  setCaliperX: (value: number) => void
  setMicGap: (value: number, source?: GapSource) => void
  setMicZero: (value: number) => void
  toggleLock: () => void
  toggleExplode: () => void
  goTo: (value: number) => void
  submit: () => void
  askQuestion: () => void
  reset: () => void
}

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['tool', 'lesson', 'divisions', 'measure', 'hints', 'showLabels', 'caliperX', 'workSize', 'micGap', 'micZero'] as const

export function useMeasuringToolsSceneState(): MeasuringToolsSceneState {
  const [simulation, setSimulation] = useState(() => rememberFields('measuring-tools', createMeasuringState(), REMEMBERED_FIELDS))
  useRememberFields('measuring-tools', simulation, REMEMBERED_FIELDS)
  const simulationRef = useRef(simulation)
  const animating = isAnimating(simulation)

  useEffect(() => {
    simulationRef.current = simulation
  }, [simulation])

  useEffect(() => {
    if (!animating) return
    let frame = 0
    let last = 0
    const loop = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      const next = stepMotion(simulationRef.current, dt)
      simulationRef.current = next
      setSimulation(next)
      if (isAnimating(next)) frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [animating])

  const commit = (updater: (state: MeasuringState) => MeasuringState) => {
    setSimulation((previous) => {
      const next = updater(previous)
      simulationRef.current = next
      return next
    })
  }

  const reveal = revealReading(simulation)
  const derived = useMemo(() => {
    if (simulation.tool === 'caliper') {
      const reading = caliperReading(simulation.caliperX, simulation.divisions)
      return {
        readingText: `${reading.text} mm`,
        breakdownText: `主尺 ${reading.main} mm + 第 ${reading.line} 条 × ${reading.precision} mm`,
      }
    }
    const reading = micrometerReading(indicatedOf(simulation))
    return {
      readingText: `${reading.text} mm`,
      breakdownText: `固定 ${reading.fixed.toFixed(1)} mm + ${reading.divisions.toFixed(1)} × 0.01 mm`,
    }
  }, [simulation])

  const locked = simulation.tool === 'caliper' ? simulation.caliperLocked : simulation.micLocked
  const exploded = simulation.tool === 'caliper' ? simulation.caliperExplodeTarget > 0.5 : simulation.micExplodeTarget > 0.5

  return {
    ...simulation,
    animating,
    reveal,
    readingText: derived.readingText,
    breakdownText: derived.breakdownText,
    lockLabel: locked ? '松开' : '锁紧',
    explodeLabel: exploded ? '合拢' : '拆开',
    exploded,
    setTool: (tool) => commit((state) => setTool(state, tool)),
    setLesson: (lesson) => commit((state) => setLesson(state, lesson)),
    setDivisions: (divisions) => commit((state) => setDivisions(state, divisions)),
    setMeasure: (measure) => commit((state) => setMeasure(state, measure)),
    setView: (view) => commit((state) => setView(state, view)),
    setHints: (hints) => commit((state) => setHints(state, hints)),
    setShowLabels: (showLabels) => commit((state) => setShowLabels(state, showLabels)),
    setAnswer: (answer) => commit((state) => setAnswer(state, answer)),
    setCaliperX: (value) => commit((state) => setCaliperX(state, value)),
    setMicGap: (value, source) => commit((state) => setMicGap(state, value, source)),
    setMicZero: (value) => commit((state) => setMicZero(state, value)),
    toggleLock: () => commit(toggleLock),
    toggleExplode: () => commit(toggleExplode),
    goTo: (value) => commit((state) => goToReading(state, value)),
    submit: () => commit(submitAnswer),
    askQuestion: () => commit((state) => newQuestion(state)),
    reset: () => {
      const next = resetMeasuringState()
      simulationRef.current = next
      setSimulation(next)
    },
  }
}
