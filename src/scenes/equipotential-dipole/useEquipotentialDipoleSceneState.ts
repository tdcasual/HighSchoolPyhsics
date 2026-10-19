import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { getPlaybackRate } from '../../scene3d/playbackRate'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveDipoleReadings, type DipoleParams } from './model'

export type EquipotentialDipoleSceneState = DipoleParams & {
  elapsed: number
  running: boolean
  readings: ReturnType<typeof deriveDipoleReadings>
  setSeparation: (value: number) => void
  setCharge: (value: number) => void
  setProbeX: (value: number) => void
  setProbeY: (value: number) => void
  setFlow: (value: boolean) => void
  setShowEquipotential: (value: boolean) => void
  setShowVectors: (value: boolean) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<EquipotentialDipoleSceneState, 'readings' | 'setSeparation' | 'setCharge' | 'setProbeX' | 'setProbeY' | 'setFlow' | 'setShowEquipotential' | 'setShowVectors' | 'toggleRunning' | 'reset'>
const INITIAL_SIMULATION: Simulation = { separation: 4, charge: 3, probeX: 0.6, probeY: 1.7, flow: true, showEquipotential: true, showVectors: true, elapsed: 0, running: true }

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['separation', 'charge', 'probeX', 'probeY', 'flow', 'showEquipotential', 'showVectors'] as const

export function useEquipotentialDipoleSceneState(): EquipotentialDipoleSceneState {
  const [simulation, setSimulation] = useState<Simulation>(() => rememberFields('equipotential-dipole', INITIAL_SIMULATION, REMEMBERED_FIELDS))
  useRememberFields('equipotential-dipole', simulation, REMEMBERED_FIELDS)
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
        const delta = Math.min(0.05, Math.max(0, timestamp - previous) / 1000) * getPlaybackRate()
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
  const readings = useMemo(() => deriveDipoleReadings(simulation), [simulation])
  return {
    ...simulation,
    readings,
    setSeparation: (separation) => commit({ separation }),
    setCharge: (charge) => commit({ charge }),
    setProbeX: (probeX) => commit({ probeX }),
    setProbeY: (probeY) => commit({ probeY }),
    setFlow: (flow) => commit({ flow }),
    setShowEquipotential: (showEquipotential) => commit({ showEquipotential }),
    setShowVectors: (showVectors) => commit({ showVectors }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => { lastTimestampRef.current = null; const next = { ...INITIAL_SIMULATION }; simulationRef.current = next; setSimulation(next) },
  }
}
