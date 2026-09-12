import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveBinaryStarsReadings, type BinaryStarsParams } from './model'

export type BinaryStarsSceneState = BinaryStarsParams & {
  elapsed: number
  running: boolean
  readings: ReturnType<typeof deriveBinaryStarsReadings>
  setMass1: (value: number) => void
  setMass2: (value: number) => void
  setSeparation: (value: number) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<BinaryStarsSceneState, 'readings' | 'setMass1' | 'setMass2' | 'setSeparation' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { mass1: 4, mass2: 2, separation: 30, elapsed: 0, running: true }

export function useBinaryStarsSceneState(): BinaryStarsSceneState {
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
  const readings = useMemo(() => deriveBinaryStarsReadings(simulation), [simulation])
  return {
    ...simulation,
    readings,
    setMass1: (mass1) => commit({ mass1 }),
    setMass2: (mass2) => commit({ mass2 }),
    setSeparation: (separation) => commit({ separation }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION }; simulationRef.current = next; setSimulation(next) },
  }
}
