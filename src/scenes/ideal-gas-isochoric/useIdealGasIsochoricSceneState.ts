import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { useMemo, useState } from 'react'
import { useSimulationClock } from '../../simulation/useSimulationClock'
import { deriveIdealGasReadings, type IdealGasParams, type VolumePreset, VOLUME_PRESETS } from './model'

export type IdealGasIsochoricSceneState = IdealGasParams & {
  elapsed: number
  running: boolean
  readings: ReturnType<typeof deriveIdealGasReadings>
  setTemperatureK: (value: number) => void
  setVolumePreset: (value: VolumePreset) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<
  IdealGasIsochoricSceneState,
  'running' | 'readings' | 'setTemperatureK' | 'setVolumePreset' | 'toggleRunning' | 'reset'
>
const INITIAL_SIMULATION: Simulation = { temperatureK: 220, volumeL: 6, volumePreset: 'large', elapsed: 0 }

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['temperatureK', 'volumeL', 'volumePreset'] as const

export function useIdealGasIsochoricSceneState(): IdealGasIsochoricSceneState {
  const [simulation, setSimulation] = useState<Simulation>(() =>
    rememberFields('ideal-gas-isochoric', INITIAL_SIMULATION, REMEMBERED_FIELDS),
  )
  useRememberFields('ideal-gas-isochoric', simulation, REMEMBERED_FIELDS)
  // Molecular motion only animates; there is no 单步 (see sceneConventions NO_STEP).
  const clock = useSimulationClock({
    initiallyRunning: true,
    stepSeconds: 0,
    advance: (dt) => setSimulation((current) => ({ ...current, elapsed: current.elapsed + dt })),
  })
  const commit = (patch: Partial<Simulation>) => setSimulation((previous) => ({ ...previous, ...patch }))

  const readings = useMemo(() => deriveIdealGasReadings(simulation), [simulation])
  return {
    ...simulation,
    readings,
    setTemperatureK: (temperatureK) => commit({ temperatureK }),
    setVolumePreset: (volumePreset) => commit({ volumePreset, volumeL: VOLUME_PRESETS[volumePreset].volumeL }),
    running: clock.running,
    toggleRunning: clock.toggle,
    reset: () => {
      setSimulation(INITIAL_SIMULATION)
      clock.play()
    },
  }
}
