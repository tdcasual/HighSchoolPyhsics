import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveBulletBlockReadings, type BulletBlockParams } from './model'

export type BulletBlockSceneState = BulletBlockParams & { elapsed: number; running: boolean; readings: ReturnType<typeof deriveBulletBlockReadings>; setBulletSpeed: (value: number) => void; setBulletMass: (value: number) => void; setBlockMass: (value: number) => void; setResistance: (value: number) => void; toggleRunning: () => void; reset: () => void }
type Simulation = Omit<BulletBlockSceneState, 'readings' | 'setBulletSpeed' | 'setBulletMass' | 'setBlockMass' | 'setResistance' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { bulletSpeed: 25, bulletMass: 1, blockMass: 5, resistance: 50, elapsed: 0.28, running: true }
export function useBulletBlockSceneState(): BulletBlockSceneState {
  const [simulation, setSimulation] = useState<Simulation>(INITIAL_SIMULATION)
  const simulationRef = useRef(simulation)
  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  useEffect(() => { simulationRef.current = simulation }, [simulation])
  useEffect(() => {
    if (!simulation.running || frameRef.current !== null) return
    const tick = (timestamp: number) => { const previous = lastTimestampRef.current; lastTimestampRef.current = timestamp; if (previous !== null) { const delta = Math.min(0.05, Math.max(0, timestamp - previous) / 1000); const current = simulationRef.current; simulationRef.current = { ...current, elapsed: (current.elapsed + delta) % 2.8 }; setSimulation(simulationRef.current) } if (simulationRef.current.running) frameRef.current = requestAnimationFrame(tick); else frameRef.current = null }
    frameRef.current = requestAnimationFrame(tick)
    return () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); frameRef.current = null; lastTimestampRef.current = null }
  }, [simulation.running])
  const commit = useCallback((patch: Partial<Simulation>) => { setSimulation((previous) => { const next = { ...previous, ...patch }; simulationRef.current = next; return next }) }, [])
  const readings = useMemo(() => deriveBulletBlockReadings(simulation, simulation.elapsed), [simulation])
  return { ...simulation, readings, setBulletSpeed: (bulletSpeed) => commit({ bulletSpeed }), setBulletMass: (bulletMass) => commit({ bulletMass }), setBlockMass: (blockMass) => commit({ blockMass }), setResistance: (resistance) => commit({ resistance }), toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) }, reset: () => { lastTimestampRef.current = null; simulationRef.current = INITIAL_SIMULATION; setSimulation(INITIAL_SIMULATION) } }
}
