import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

type Simulation = Omit<IdealGasIsochoricSceneState, 'readings' | 'setTemperatureK' | 'setVolumePreset' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { temperatureK: 220, volumeL: 6, volumePreset: 'large', elapsed: 0, running: true }

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['temperatureK', 'volumeL', 'volumePreset'] as const

export function useIdealGasIsochoricSceneState(): IdealGasIsochoricSceneState {
  const [simulation, setSimulation] = useState<Simulation>(() => rememberFields('ideal-gas-isochoric', INITIAL_SIMULATION, REMEMBERED_FIELDS))
  useRememberFields('ideal-gas-isochoric', simulation, REMEMBERED_FIELDS)
  const simulationRef = useRef(simulation)
  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)

  useEffect(() => { simulationRef.current = simulation }, [simulation])
  useEffect(() => {
    if (!simulation.running || frameRef.current !== null) return
    const tick = (timestamp: number) => {
      const previous = lastTimestampRef.current
      lastTimestampRef.current = timestamp
      if (previous !== null) {
        const delta = Math.min(0.05, Math.max(0, timestamp - previous) / 1000)
        const current = simulationRef.current
        simulationRef.current = { ...current, elapsed: current.elapsed + delta }
        setSimulation(simulationRef.current)
      }
      if (simulationRef.current.running) frameRef.current = requestAnimationFrame(tick)
      else frameRef.current = null
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      lastTimestampRef.current = null
    }
  }, [simulation.running])

  const commit = useCallback((patch: Partial<Simulation>) => {
    setSimulation((previous) => {
      const next = { ...previous, ...patch }
      simulationRef.current = next
      return next
    })
  }, [])

  const readings = useMemo(() => deriveIdealGasReadings(simulation), [simulation])
  return {
    ...simulation,
    readings,
    setTemperatureK: (temperatureK) => commit({ temperatureK }),
    setVolumePreset: (volumePreset) => commit({ volumePreset, volumeL: VOLUME_PRESETS[volumePreset].volumeL }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; simulationRef.current = INITIAL_SIMULATION; setSimulation(INITIAL_SIMULATION) },
  }
}
