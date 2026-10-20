import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { useMemo, useState } from 'react'
import { useSimulationClock } from '../../simulation/useSimulationClock'
import { deriveGeneratorReadings, positionDescription, wrapAngle, type GeneratorMode } from './model'

export type GeneratorCoreSceneState = {
  mode: GeneratorMode
  angleRad: number
  angularSpeedRad: number
  setAngleRad: (value: number) => void
  running: boolean
  readings: ReturnType<typeof deriveGeneratorReadings>
  description: string
  setMode: (mode: GeneratorMode) => void
  setAngularSpeedRad: (value: number) => void
  toggleRunning: () => void
  /** Pause and turn the coil by 15°. */
  step: () => void
  reset: () => void
}

type Simulation = Pick<GeneratorCoreSceneState, 'mode' | 'angleRad' | 'angularSpeedRad'>

/** 单步 turns the coil 15°, enough to see Φ and e change between neutral and parallel positions. */
const STEP_ANGLE_RAD = Math.PI / 12

const INITIAL_SIMULATION: Simulation = {
  mode: 'model',
  angleRad: 0,
  angularSpeedRad: 1.2,
}

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['mode', 'angularSpeedRad'] as const

export function useGeneratorCoreSceneState(): GeneratorCoreSceneState {
  const [simulation, setSimulation] = useState<Simulation>(() => rememberFields('generator-core', INITIAL_SIMULATION, REMEMBERED_FIELDS))
  useRememberFields('generator-core', simulation, REMEMBERED_FIELDS)
  const clock = useSimulationClock({
    initiallyRunning: true,
    stepSeconds: simulation.angularSpeedRad > 0 ? STEP_ANGLE_RAD / simulation.angularSpeedRad : 0,
    advance: (dt) => setSimulation((current) => ({ ...current, angleRad: wrapAngle(current.angleRad + dt * current.angularSpeedRad) })),
  })
  const commit = (patch: Partial<Simulation>) => setSimulation((previous) => ({ ...previous, ...patch }))
  const readings = useMemo(() => deriveGeneratorReadings(simulation.angleRad), [simulation.angleRad])
  return {
    ...simulation,
    running: clock.running,
    readings,
    description: positionDescription(readings),
    setMode: (mode) => commit({ mode }),
    setAngleRad: (angleRad) => commit({ angleRad }),
    setAngularSpeedRad: (angularSpeedRad) => commit({ angularSpeedRad }),
    toggleRunning: clock.toggle,
    step: clock.step,
    reset: () => {
      setSimulation({ ...INITIAL_SIMULATION })
      clock.play()
    },
  }
}
