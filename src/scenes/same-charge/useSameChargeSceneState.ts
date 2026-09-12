import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveSameChargeReadings, type SameChargeParams, type SameChargePolarity } from './model'

export type SameChargeSceneState = SameChargeParams & {
  elapsed: number
  running: boolean
  readings: ReturnType<typeof deriveSameChargeReadings>
  setSeparation: (value: number) => void
  setCharge: (value: number) => void
  setProbeX: (value: number) => void
  setProbeY: (value: number) => void
  setPolarity: (value: SameChargePolarity) => void
  setFlow: (value: boolean) => void
  setShowEquipotential: (value: boolean) => void
  setShowVectors: (value: boolean) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<SameChargeSceneState, 'readings' | 'setSeparation' | 'setCharge' | 'setProbeX' | 'setProbeY' | 'setPolarity' | 'setFlow' | 'setShowEquipotential' | 'setShowVectors' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { separation: 4, charge: 3, probeX: 0, probeY: 2.8, polarity: 'positive', flow: true, showEquipotential: true, showVectors: true, elapsed: 0, running: true }

export function useSameChargeSceneState(): SameChargeSceneState {
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
  const readings = useMemo(() => deriveSameChargeReadings(simulation), [simulation])
  return {
    ...simulation,
    readings,
    setSeparation: (separation) => commit({ separation }),
    setCharge: (charge) => commit({ charge }),
    setProbeX: (probeX) => commit({ probeX }),
    setProbeY: (probeY) => commit({ probeY }),
    setPolarity: (polarity) => commit({ polarity }),
    setFlow: (flow) => commit({ flow }),
    setShowEquipotential: (showEquipotential) => commit({ showEquipotential }),
    setShowVectors: (showVectors) => commit({ showVectors }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION }; simulationRef.current = next; setSimulation(next) },
  }
}
