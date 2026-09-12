import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveCyclotronReadings, type ParticleType } from './model'

export type CyclotronCoreSceneState = {
  particleType: ParticleType
  B: number
  U: number
  elapsed: number
  running: boolean
  readings: ReturnType<typeof deriveCyclotronReadings>
  setParticleType: (type: ParticleType) => void
  setB: (value: number) => void
  setU: (value: number) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<CyclotronCoreSceneState, 'readings' | 'setParticleType' | 'setB' | 'setU' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { particleType: 'proton', B: 3, U: 30, elapsed: 0, running: true }

export function useCyclotronCoreSceneState(): CyclotronCoreSceneState {
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
  const readings = useMemo(() => deriveCyclotronReadings({ type: simulation.particleType, B: simulation.B, U: simulation.U, elapsed: simulation.elapsed, running: simulation.running }), [simulation])
  return {
    ...simulation,
    readings,
    setParticleType: (particleType) => commit({ particleType }),
    setB: (B) => commit({ B }),
    setU: (U) => commit({ U }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION }; simulationRef.current = next; setSimulation(next) },
  }
}
