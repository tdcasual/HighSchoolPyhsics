import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { angleOf, deriveForceReadings, magnitude, resolveRangeAngle, snapVector, type ForceMode, type SynthesisRule, type Vector2 } from './model'

export type ForceCompositionSceneState = {
  mode: ForceMode
  rule: SynthesisRule
  f1: Vector2
  f2: Vector2
  rangeF1: number
  rangeF2: number
  rangeAngleDeg: number
  displayRangeAngleDeg: number
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
  setSynthesisF1Magnitude: (value: number) => void
  setSynthesisF2Magnitude: (value: number) => void
  setSynthesisAngleDeg: (value: number) => void
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

type Simulation = Omit<ForceCompositionSceneState, 'readings' | 'displayRangeAngleDeg' | 'setMode' | 'setRule' | 'setF1' | 'setF2' | 'setSynthesisF1Magnitude' | 'setSynthesisF2Magnitude' | 'setSynthesisAngleDeg' | 'setRangeF1' | 'setRangeF2' | 'setRangeAngleDeg' | 'setRangeSweep' | 'setOrthogonalMagnitude' | 'setOrthogonalAngleDeg' | 'setGravity' | 'setSlopeAngleDeg' | 'toggleRunning' | 'reset'>

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
    if (!simulation.running || simulation.mode !== 'range' || !simulation.rangeSweep || frameRef.current !== null) return
    const tick = (timestamp: number) => {
      const previous = lastTimestampRef.current
      lastTimestampRef.current = timestamp
      if (previous !== null) {
        const delta = Math.min(0.05, Math.max(0, timestamp - previous) / 1000)
        const current = simulationRef.current
        simulationRef.current = { ...current, elapsed: current.elapsed + delta }
        setSimulation(simulationRef.current)
      }
      if (simulationRef.current.running && simulationRef.current.mode === 'range' && simulationRef.current.rangeSweep) frameRef.current = requestAnimationFrame(tick)
      else frameRef.current = null
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); frameRef.current = null; lastTimestampRef.current = null }
  }, [simulation.running, simulation.mode, simulation.rangeSweep])
  const commit = useCallback((patch: Partial<Simulation>) => { setSimulation((previous) => { const next = { ...previous, ...patch }; simulationRef.current = next; return next }) }, [])
  const displayRangeAngleDeg = resolveRangeAngle(simulation.rangeAngleDeg, simulation.rangeSweep && simulation.mode === 'range', simulation.running, simulation.elapsed)
  const readings = useMemo(() => deriveForceReadings({ ...simulation, mode: simulation.mode, rangeAngleDeg: displayRangeAngleDeg }), [simulation, displayRangeAngleDeg])
  const setVectorMagnitude = useCallback((vector: Vector2, value: number): Vector2 => {
    const currentMagnitude = magnitude(vector)
    const angle = currentMagnitude > 0.001 ? angleOf(vector) : 0
    const radians = angle * Math.PI / 180
    return { x: Math.cos(radians) * value, y: Math.sin(radians) * value }
  }, [])
  return {
    ...simulation, displayRangeAngleDeg, readings,
    setMode: (mode) => commit({ mode }), setRule: (rule) => commit({ rule }),
    setF1: (vector) => commit({ f1: snapVector(vector, simulationRef.current.f2) }), setF2: (vector) => commit({ f2: snapVector(vector, simulationRef.current.f1) }),
    setSynthesisF1Magnitude: (value) => commit({ f1: setVectorMagnitude(simulationRef.current.f1, value) }),
    setSynthesisF2Magnitude: (value) => commit({ f2: setVectorMagnitude(simulationRef.current.f2, value) }),
    setSynthesisAngleDeg: (value) => {
      const current = simulationRef.current
      const f1Angle = angleOf(current.f1)
      const currentDifference = angleOf(current.f2) - f1Angle
      const sign = currentDifference === 0 ? 1 : Math.sign(currentDifference)
      const angle = (f1Angle + sign * Math.max(0, Math.min(180, value))) * Math.PI / 180
      const f2Magnitude = magnitude(current.f2)
      commit({ f2: { x: Math.cos(angle) * f2Magnitude, y: Math.sin(angle) * f2Magnitude } })
    },
    setRangeF1: (rangeF1) => commit({ rangeF1 }), setRangeF2: (rangeF2) => commit({ rangeF2 }), setRangeAngleDeg: (rangeAngleDeg) => commit({ rangeAngleDeg }), setRangeSweep: (rangeSweep) => commit({ rangeSweep }),
    setOrthogonalMagnitude: (orthogonalMagnitude) => commit({ orthogonalMagnitude }), setOrthogonalAngleDeg: (orthogonalAngleDeg) => commit({ orthogonalAngleDeg }), setGravity: (gravity) => commit({ gravity }), setSlopeAngleDeg: (slopeAngleDeg) => commit({ slopeAngleDeg }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION, f1: { ...INITIAL_SIMULATION.f1 }, f2: { ...INITIAL_SIMULATION.f2 } }; simulationRef.current = next; setSimulation(next) },
  }
}
