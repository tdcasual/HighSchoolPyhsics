import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveProjectileReadings, type ProjectileMode, type ProjectileParams } from './model'

export type ProjectileDataAnalysisSceneState = ProjectileParams & { mode: ProjectileMode; elapsed: number; running: boolean; readings: ReturnType<typeof deriveProjectileReadings>; setMode: (mode: ProjectileMode) => void; setInitialSpeed: (value: number) => void; setGravity: (value: number) => void; setFlashPeriod: (value: number) => void; toggleRunning: () => void; reset: () => void }
type Simulation = Omit<ProjectileDataAnalysisSceneState, 'readings' | 'setMode' | 'setInitialSpeed' | 'setGravity' | 'setFlashPeriod' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { initialSpeed: 2, gravity: 10, flashPeriod: 0.15, mode: 'data', elapsed: 0.28, running: true }

export function useProjectileDataAnalysisSceneState(): ProjectileDataAnalysisSceneState {
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
        const duration = Math.max(current.flashPeriod * 4.2, 0.75)
        simulationRef.current = { ...current, elapsed: (current.elapsed + delta) % duration }
        setSimulation(simulationRef.current)
      }
      if (simulationRef.current.running) frameRef.current = requestAnimationFrame(tick); else frameRef.current = null
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); frameRef.current = null; lastTimestampRef.current = null }
  }, [simulation.running])
  const commit = useCallback((patch: Partial<Simulation>) => { setSimulation((previous) => { const next = { ...previous, ...patch }; simulationRef.current = next; return next }) }, [])
  const readings = useMemo(() => deriveProjectileReadings(simulation, simulation.elapsed), [simulation])
  return { ...simulation, readings, setMode: (mode) => commit({ mode }), setInitialSpeed: (initialSpeed) => commit({ initialSpeed }), setGravity: (gravity) => commit({ gravity }), setFlashPeriod: (flashPeriod) => commit({ flashPeriod }), toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) }, reset: () => { lastTimestampRef.current = null; simulationRef.current = INITIAL_SIMULATION; setSimulation(INITIAL_SIMULATION) } }
}
