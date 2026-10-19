import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  reset: () => void
}

type Simulation = Omit<OrthogonalEmWaveSceneState, 'readings' | 'setAmplitude' | 'setWavelength' | 'setSpeed' | 'setDirection' | 'setViewMode' | 'setShowOrthogonality' | 'setShowProjectionMarks' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = {
  amplitude: 1,
  wavelength: 4,
  speed: 4,
  direction: 'right',
  viewMode: '3d',
  elapsed: 0,
  running: false,
  showOrthogonality: true,
  showProjectionMarks: true,
}

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['amplitude', 'wavelength', 'speed', 'direction', 'viewMode', 'showOrthogonality', 'showProjectionMarks'] as const

export function useOrthogonalEmWaveSceneState(): OrthogonalEmWaveSceneState {
  const [simulation, setSimulation] = useState<Simulation>(() => rememberFields('orthogonal-em-wave', INITIAL_SIMULATION, REMEMBERED_FIELDS))
  useRememberFields('orthogonal-em-wave', simulation, REMEMBERED_FIELDS)
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
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION }; simulationRef.current = next; setSimulation(next) },
  }
}
