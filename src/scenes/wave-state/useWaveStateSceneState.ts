import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveWaveReadings, type WaveDirection, type WaveParams } from './model'

export type WaveStateSceneState = WaveParams & {
  elapsed: number
  running: boolean
  showGhost: boolean
  showVelocity: boolean
  showAcceleration: boolean
  readings: ReturnType<typeof deriveWaveReadings>
  setAmplitude: (value: number) => void
  setWavelength: (value: number) => void
  setPeriod: (value: number) => void
  setDirection: (value: WaveDirection) => void
  setShowGhost: (value: boolean) => void
  setShowVelocity: (value: boolean) => void
  setShowAcceleration: (value: boolean) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<WaveStateSceneState, 'readings' | 'setAmplitude' | 'setWavelength' | 'setPeriod' | 'setDirection' | 'setShowGhost' | 'setShowVelocity' | 'setShowAcceleration' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { amplitude: 10, wavelength: 4, period: 2, direction: 'right', elapsed: 0, running: true, showGhost: false, showVelocity: true, showAcceleration: true }

export function useWaveStateSceneState(): WaveStateSceneState {
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
  const readings = useMemo(() => deriveWaveReadings(simulation.elapsed, simulation), [simulation])
  return {
    ...simulation,
    readings,
    setAmplitude: (amplitude) => commit({ amplitude }),
    setWavelength: (wavelength) => commit({ wavelength }),
    setPeriod: (period) => commit({ period }),
    setDirection: (direction) => commit({ direction }),
    setShowGhost: (showGhost) => commit({ showGhost }),
    setShowVelocity: (showVelocity) => commit({ showVelocity }),
    setShowAcceleration: (showAcceleration) => commit({ showAcceleration }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION }; simulationRef.current = next; setSimulation(next) },
  }
}
