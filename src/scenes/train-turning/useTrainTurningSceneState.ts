import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveTrainReadings, type TrainParams } from './model'

export type TrainTurningSceneState = TrainParams & {
  elapsed: number
  running: boolean
  readings: ReturnType<typeof deriveTrainReadings>
  setSpeed: (value: number) => void
  setAngleDeg: (value: number) => void
  setRadius: (value: number) => void
  setIdealSpeed: () => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<TrainTurningSceneState, 'readings' | 'setSpeed' | 'setAngleDeg' | 'setRadius' | 'setIdealSpeed' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { speed: 29.5, angleDeg: 16, radius: 80, elapsed: 0, running: true }

export function useTrainTurningSceneState(): TrainTurningSceneState {
  const [simulation, setSimulation] = useState<Simulation>(INITIAL_SIMULATION)
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
    return () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); frameRef.current = null; lastTimestampRef.current = null }
  }, [simulation.running])
  const commit = useCallback((patch: Partial<Simulation>) => {
    setSimulation((previous) => { const next = { ...previous, ...patch }; simulationRef.current = next; return next })
  }, [])
  const readings = useMemo(() => deriveTrainReadings(simulation), [simulation])
  return {
    ...simulation,
    readings,
    setSpeed: (speed) => commit({ speed }),
    setAngleDeg: (angleDeg) => commit({ angleDeg }),
    setRadius: (radius) => commit({ radius }),
    setIdealSpeed: () => commit({ speed: Number(deriveTrainReadings(simulation).idealSpeed.toFixed(1)) }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION }; simulationRef.current = next; setSimulation(next) },
  }
}
