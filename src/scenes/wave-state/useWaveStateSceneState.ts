import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { useMemo, useState } from 'react'
import { useSimulationClock } from '../../simulation/useSimulationClock'
import { DEFAULT_PROBE_X, deriveWaveReadings, type WaveDirection, type WaveParams, type WavePreset, type WaveStartDirection } from './model'
type WaveStateParams = Omit<WaveParams, 'startDirection'> & { startDirection: WaveStartDirection }
export type WaveStateSceneState = WaveStateParams & {
  probeX: number
  timeScale: number
  elapsed: number
  running: boolean
  showGhost: boolean
  showVelocity: boolean
  showAcceleration: boolean
  readings: ReturnType<typeof deriveWaveReadings>
  setAmplitude: (value: number) => void
  setWavelength: (value: number) => void
  setPeriod: (value: number) => void
  setDirection: (value: WaveDirection) => void
  setStartDirection: (value: WaveStartDirection) => void
  setProbeX: (value: number) => void
  setTimeScale: (value: number) => void
  setPreset: (preset: WavePreset) => void
  setShowGhost: (value: boolean) => void
  setShowVelocity: (value: boolean) => void
  setShowAcceleration: (value: boolean) => void
  toggleRunning: () => void
  /** Pause and advance a quarter period (the textbook's T/4 snapshots). */
  step: () => void
  reset: () => void
}
type Simulation = Omit<WaveStateSceneState, 'running' | 'readings' | 'setAmplitude' | 'setWavelength' | 'setPeriod' | 'setDirection' | 'setStartDirection' | 'setProbeX' | 'setTimeScale' | 'setPreset' | 'setShowGhost' | 'setShowVelocity' | 'setShowAcceleration' | 'toggleRunning' | 'step' | 'reset'>
const INITIAL_SIMULATION: Simulation = {
  amplitude: 50, wavelength: 4, period: 2, direction: 'right', startDirection: 'up',
  probeX: DEFAULT_PROBE_X, timeScale: 0.5, elapsed: 0,
  showGhost: false, showVelocity: true, showAcceleration: true,
}
/**
 * The scene opens paused with the wave front halfway to P (it arrives at t = 3 s), so the class
 * sees a waveform and can predict P's start-up direction straight away. 重置 replays from t = 0.
 */
export const OPENING_ELAPSED = 1.5
/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['amplitude', 'wavelength', 'period', 'direction', 'startDirection', 'probeX', 'timeScale', 'showGhost', 'showVelocity', 'showAcceleration'] as const

export function useWaveStateSceneState(): WaveStateSceneState {
  const [simulation, setSimulation] = useState<Simulation>(() => rememberFields('wave-state', ({ ...INITIAL_SIMULATION, elapsed: OPENING_ELAPSED }), REMEMBERED_FIELDS))
  useRememberFields('wave-state', simulation, REMEMBERED_FIELDS)
  // The scene's own 时间缩放 slider multiplies the shared slow motion; 单步 = T/4.
  const clock = useSimulationClock({
    timeScale: simulation.timeScale,
    stepSeconds: simulation.period / 4,
    advance: (dt) => setSimulation((current) => ({ ...current, elapsed: current.elapsed + dt })),
  })
  const commit = (patch: Partial<Simulation>) => setSimulation((previous) => ({ ...previous, ...patch }))
  const readings = useMemo(
    () => deriveWaveReadings(simulation.elapsed, simulation, simulation.probeX),
    [simulation],
  )
  const resetElapsedAndCommit = (patch: Partial<Simulation>) => commit({ ...patch, elapsed: 0 })
  const setPreset = (preset: WavePreset) => {
    if (preset === 'baseline') {
      resetElapsedAndCommit({ amplitude: 50, wavelength: 4, period: 2, direction: 'right', startDirection: 'up', probeX: 6, timeScale: 0.5 })
    } else if (preset === 'leftward') {
      resetElapsedAndCommit({ direction: 'left', startDirection: 'down' })
    } else if (preset === 'double-frequency') {
      resetElapsedAndCommit({ wavelength: 2, period: 1, direction: 'right', startDirection: 'up' })
    } else {
      resetElapsedAndCommit({
        amplitude: 100, wavelength: 4, period: 2, direction: 'right',
        startDirection: 'up', probeX: 6, timeScale: 0.5,
      })
    }
  }
  return {
    ...simulation,
    readings,
    setAmplitude: (amplitude) => resetElapsedAndCommit({ amplitude }),
    setWavelength: (wavelength) => resetElapsedAndCommit({ wavelength }),
    setPeriod: (period) => resetElapsedAndCommit({ period }),
    setDirection: (direction) => resetElapsedAndCommit({ direction }),
    setStartDirection: (startDirection) => resetElapsedAndCommit({ startDirection }),
    setProbeX: (probeX) => commit({ probeX }),
    setTimeScale: (timeScale) => commit({ timeScale }),
    setPreset,
    setShowGhost: (showGhost) => commit({ showGhost }),
    setShowVelocity: (showVelocity) => commit({ showVelocity }),
    setShowAcceleration: (showAcceleration) => commit({ showAcceleration }),
    running: clock.running,
    toggleRunning: clock.toggle,
    step: clock.step,
    reset: () => {
      clock.pause()
      setSimulation({ ...INITIAL_SIMULATION })
    },
  }
}
