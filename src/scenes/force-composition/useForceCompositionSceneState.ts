import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveForceReadings, snapVector, type ForceMode, type SynthesisRule, type Vector2 } from './model'

export type ForceCompositionSceneState = {
  mode: ForceMode
  rule: SynthesisRule
  f1: Vector2
  f2: Vector2
  rangeF1: number
  rangeF2: number
  rangeAngleDeg: number
  rangeSweep: boolean
  orthogonalMagnitude: number
  orthogonalAngleDeg: number
  gravity: number
  slopeAngleDeg: number
  elapsed: number
  running: boolean
  readings: ReturnType<typeof deriveForceReadings>
  setMode: (mode: ForceMode) => void
  setRule: (rule: SynthesisRule) => void
  setF1: (vector: Vector2) => void
  setF2: (vector: Vector2) => void
  setRangeF1: (value: number) => void
  setRangeF2: (value: number) => void
  setRangeAngleDeg: (value: number) => void
  setRangeSweep: (value: boolean) => void
  setOrthogonalMagnitude: (value: number) => void
  setOrthogonalAngleDeg: (value: number) => void
  setGravity: (value: number) => void
  setSlopeAngleDeg: (value: number) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<ForceCompositionSceneState, 'readings' | 'setMode' | 'setRule' | 'setF1' | 'setF2' | 'setRangeF1' | 'setRangeF2' | 'setRangeAngleDeg' | 'setRangeSweep' | 'setOrthogonalMagnitude' | 'setOrthogonalAngleDeg' | 'setGravity' | 'setSlopeAngleDeg' | 'toggleRunning' | 'reset'>

const INITIAL_SIMULATION: Simulation = {
  mode: 'synthesis', rule: 'parallelogram', f1: { x: 4, y: 2 }, f2: { x: 1, y: 4 }, rangeF1: 40, rangeF2: 30, rangeAngleDeg: 60, rangeSweep: true,
  orthogonalMagnitude: 50, orthogonalAngleDeg: 36.87, gravity: 40, slopeAngleDeg: 30, elapsed: 0, running: true,
}

export function useForceCompositionSceneState(): ForceCompositionSceneState {
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
  const commit = useCallback((patch: Partial<Simulation>) => { setSimulation((previous) => { const next = { ...previous, ...patch }; simulationRef.current = next; return next }) }, [])
  const readings = useMemo(() => deriveForceReadings({ ...simulation, mode: simulation.mode }), [simulation])
  return {
    ...simulation, readings,
    setMode: (mode) => commit({ mode }), setRule: (rule) => commit({ rule }),
    setF1: (vector) => commit({ f1: snapVector(vector) }), setF2: (vector) => commit({ f2: snapVector(vector) }),
    setRangeF1: (rangeF1) => commit({ rangeF1 }), setRangeF2: (rangeF2) => commit({ rangeF2 }), setRangeAngleDeg: (rangeAngleDeg) => commit({ rangeAngleDeg }), setRangeSweep: (rangeSweep) => commit({ rangeSweep }),
    setOrthogonalMagnitude: (orthogonalMagnitude) => commit({ orthogonalMagnitude }), setOrthogonalAngleDeg: (orthogonalAngleDeg) => commit({ orthogonalAngleDeg }), setGravity: (gravity) => commit({ gravity }), setSlopeAngleDeg: (slopeAngleDeg) => commit({ slopeAngleDeg }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION, f1: { ...INITIAL_SIMULATION.f1 }, f2: { ...INITIAL_SIMULATION.f2 } }; simulationRef.current = next; setSimulation(next) },
  }
}

