import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveParallelogramReadings, type ParallelogramParams, type VerificationStep } from './model'

export type ForceParallelogramSceneState = ParallelogramParams & {
  elapsed: number
  running: boolean
  readings: ReturnType<typeof deriveParallelogramReadings>
  setF1: (value: number) => void
  setF2: (value: number) => void
  setAngleDeg: (value: number) => void
  setStep: (value: VerificationStep) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<ForceParallelogramSceneState, 'readings' | 'setF1' | 'setF2' | 'setAngleDeg' | 'setStep' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { f1: 1.82, f2: 1.82, angleDeg: 100, step: 'compare', elapsed: 0, running: true }

export function useForceParallelogramSceneState(): ForceParallelogramSceneState {
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
  const readings = useMemo(() => deriveParallelogramReadings(simulation), [simulation])
  return {
    ...simulation,
    readings,
    setF1: (f1) => commit({ f1 }),
    setF2: (f2) => commit({ f2 }),
    setAngleDeg: (angleDeg) => commit({ angleDeg }),
    setStep: (step) => commit({ step }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION }; simulationRef.current = next; setSimulation(next) },
  }
}
