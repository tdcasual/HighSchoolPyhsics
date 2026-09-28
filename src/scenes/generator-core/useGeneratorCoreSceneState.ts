import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveGeneratorReadings, positionDescription, wrapAngle, type GeneratorMode } from './model'

export type GeneratorCoreSceneState = {
  mode: GeneratorMode
  angleRad: number
  angularSpeedRad: number
  setAngleRad: (value: number) => void
  running: boolean
  readings: ReturnType<typeof deriveGeneratorReadings>
  description: string
  setMode: (mode: GeneratorMode) => void
  setAngularSpeedRad: (value: number) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Pick<GeneratorCoreSceneState, 'mode' | 'angleRad' | 'angularSpeedRad' | 'running'>

const INITIAL_SIMULATION: Simulation = {
  mode: 'model',
  angleRad: 0,
  angularSpeedRad: 1.2,
  running: true,
}

export function useGeneratorCoreSceneState(): GeneratorCoreSceneState {
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
        const next = { ...current, angleRad: wrapAngle(current.angleRad + delta * current.angularSpeedRad) }
        simulationRef.current = next
        setSimulation(next)
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
  const readings = useMemo(() => deriveGeneratorReadings(simulation.angleRad), [simulation.angleRad])
  return {
    ...simulation,
    readings,
    description: positionDescription(readings),
    setMode: (mode) => commit({ mode }),
    setAngleRad: (angleRad) => commit({ angleRad }),
    setAngularSpeedRad: (angularSpeedRad) => commit({ angularSpeedRad }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => {
      lastTimestampRef.current = null
      const next = { ...INITIAL_SIMULATION }
      simulationRef.current = next
      setSimulation(next)
    },
  }
}
