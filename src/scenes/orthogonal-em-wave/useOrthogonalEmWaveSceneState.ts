import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { useMemo, useState } from 'react'
import { useSimulationClock } from '../../simulation/useSimulationClock'
import { deriveEmWaveReadings, type EmViewMode, type EmWaveDirection, type EmWaveParams } from './model'

export type OrthogonalEmWaveSceneState = EmWaveParams & {
  viewMode: EmViewMode
  elapsed: number
  running: boolean
  showOrthogonality: boolean
  showProjectionMarks: boolean
  readings: ReturnType<typeof deriveEmWaveReadings>
  setAmplitude: (value: number) => void
  setWavelength: (value: number) => void
  setSpeed: (value: number) => void
  setDirection: (value: EmWaveDirection) => void
  setViewMode: (value: EmViewMode) => void
  setShowOrthogonality: (value: boolean) => void
  setShowProjectionMarks: (value: boolean) => void
  toggleRunning: () => void
  /** Pause and advance a quarter period. */
  step: () => void
  reset: () => void
}

type Simulation = Omit<OrthogonalEmWaveSceneState, 'running' | 'readings' | 'setAmplitude' | 'setWavelength' | 'setSpeed' | 'setDirection' | 'setViewMode' | 'setShowOrthogonality' | 'setShowProjectionMarks' | 'toggleRunning' | 'step' | 'reset'>
const INITIAL_SIMULATION: Simulation = {
  amplitude: 1,
  wavelength: 4,
  speed: 4,
  direction: 'right',
  viewMode: '3d',
  elapsed: 0,
  showOrthogonality: true,
  showProjectionMarks: true,
}

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['amplitude', 'wavelength', 'speed', 'direction', 'viewMode', 'showOrthogonality', 'showProjectionMarks'] as const

export function useOrthogonalEmWaveSceneState(): OrthogonalEmWaveSceneState {
  const [simulation, setSimulation] = useState<Simulation>(() => rememberFields('orthogonal-em-wave', INITIAL_SIMULATION, REMEMBERED_FIELDS))
  useRememberFields('orthogonal-em-wave', simulation, REMEMBERED_FIELDS)
  // 单步 = T/4 = λ/(4v).
  const clock = useSimulationClock({
    stepSeconds: simulation.wavelength / Math.max(1e-6, simulation.speed) / 4,
    advance: (dt) => setSimulation((current) => ({ ...current, elapsed: current.elapsed + dt })),
  })
  const commit = (patch: Partial<Simulation>) => setSimulation((previous) => ({ ...previous, ...patch }))
  const readings = useMemo(() => deriveEmWaveReadings(simulation.elapsed, simulation), [simulation])

  return {
    ...simulation,
    readings,
    setAmplitude: (amplitude) => commit({ amplitude }),
    setWavelength: (wavelength) => commit({ wavelength }),
    setSpeed: (speed) => commit({ speed }),
    setDirection: (direction) => commit({ direction }),
    setViewMode: (viewMode) => commit({ viewMode }),
    setShowOrthogonality: (showOrthogonality) => commit({ showOrthogonality }),
    setShowProjectionMarks: (showProjectionMarks) => commit({ showProjectionMarks }),
    running: clock.running,
    toggleRunning: clock.toggle,
    step: clock.step,
    reset: () => {
      clock.pause()
      setSimulation({ ...INITIAL_SIMULATION })
    },
  }
}
