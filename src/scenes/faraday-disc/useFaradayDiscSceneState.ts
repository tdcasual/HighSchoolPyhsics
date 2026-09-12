import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveFaradayDiscReadings, type CircuitState, type FaradayDiscParams, type MagneticDirection, type RotationDirection } from './model'

export type FaradayDiscSceneState = FaradayDiscParams & {
  elapsed: number
  running: boolean
  readings: ReturnType<typeof deriveFaradayDiscReadings>
  setB: (value: number) => void
  setOmega: (value: number) => void
  setRadius: (value: number) => void
  setExternalResistance: (value: number) => void
  setRotation: (value: RotationDirection) => void
  setMagnetic: (value: MagneticDirection) => void
  setCircuit: (value: CircuitState) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<FaradayDiscSceneState, 'readings' | 'setB' | 'setOmega' | 'setRadius' | 'setExternalResistance' | 'setRotation' | 'setMagnetic' | 'setCircuit' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { B: 1, omega: 10, radius: 0.2, externalResistance: 2, rotation: 'cw', magnetic: 'into', circuit: 'closed', elapsed: 0, running: true }

export function useFaradayDiscSceneState(): FaradayDiscSceneState {
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
  const readings = useMemo(() => deriveFaradayDiscReadings(simulation), [simulation])
  return {
    ...simulation,
    readings,
    setB: (B) => commit({ B }),
    setOmega: (omega) => commit({ omega }),
    setRadius: (radius) => commit({ radius }),
    setExternalResistance: (externalResistance) => commit({ externalResistance }),
    setRotation: (rotation) => commit({ rotation }),
    setMagnetic: (magnetic) => commit({ magnetic }),
    setCircuit: (circuit) => commit({ circuit }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION }; simulationRef.current = next; setSimulation(next) },
  }
}
