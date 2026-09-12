import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveCentripetalReadings, type BeltRatio, type CentripetalParams, type CentripetalPreset } from './model'

export type CentripetalFactorsSceneState = CentripetalParams & {
  elapsed: number
  running: boolean
  readings: ReturnType<typeof deriveCentripetalReadings>
  setPreset: (value: CentripetalPreset) => void
  setBeltRatio: (value: BeltRatio) => void
  setLeftMassMultiple: (value: 1 | 2) => void
  setLeftRadiusMultiple: (value: 1 | 2) => void
  setRightMassMultiple: (value: 1 | 2) => void
  setOmegaBase: (value: number) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<CentripetalFactorsSceneState, 'readings' | 'setPreset' | 'setBeltRatio' | 'setLeftMassMultiple' | 'setLeftRadiusMultiple' | 'setRightMassMultiple' | 'setOmegaBase' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { preset: 'mass', beltRatio: '1:1', leftMassMultiple: 1, leftRadiusMultiple: 2, rightMassMultiple: 1, omegaBase: 1, elapsed: 0, running: true }

export function useCentripetalFactorsSceneState(): CentripetalFactorsSceneState {
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
  const readings = useMemo(() => deriveCentripetalReadings(simulation), [simulation])
  return {
    ...simulation,
    readings,
    setPreset: (preset) => commit({ preset }),
    setBeltRatio: (beltRatio) => commit({ beltRatio }),
    setLeftMassMultiple: (leftMassMultiple) => commit({ leftMassMultiple }),
    setLeftRadiusMultiple: (leftRadiusMultiple) => commit({ leftRadiusMultiple }),
    setRightMassMultiple: (rightMassMultiple) => commit({ rightMassMultiple }),
    setOmegaBase: (omegaBase) => commit({ omegaBase }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION }; simulationRef.current = next; setSimulation(next) },
  }
}
