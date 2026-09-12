import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveMechanicalWaveReadings, type MechanicalWaveParams } from './model'

export type MechanicalWaveGraphsSceneState = MechanicalWaveParams & {
  elapsed: number
  running: boolean
  showVelocity: boolean
  readings: ReturnType<typeof deriveMechanicalWaveReadings>
  setAmplitude: (value: number) => void
  setWavelength: (value: number) => void
  setPeriod: (value: number) => void
  setProbeX: (value: number) => void
  setShowVelocity: (value: boolean) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<MechanicalWaveGraphsSceneState, 'readings' | 'setAmplitude' | 'setWavelength' | 'setPeriod' | 'setProbeX' | 'setShowVelocity' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { amplitude: 6, wavelength: 48, period: 3.5, probeX: 24, elapsed: 7.1, running: true, showVelocity: true }

export function useMechanicalWaveGraphsSceneState(): MechanicalWaveGraphsSceneState {
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
  const readings = useMemo(() => deriveMechanicalWaveReadings(simulation.elapsed, simulation), [simulation])
  return {
    ...simulation,
    readings,
    setAmplitude: (amplitude) => commit({ amplitude }),
    setWavelength: (wavelength) => commit({ wavelength }),
    setPeriod: (period) => commit({ period }),
    setProbeX: (probeX) => commit({ probeX }),
    setShowVelocity: (showVelocity) => commit({ showVelocity }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION }; simulationRef.current = next; setSimulation(next) },
  }
}
