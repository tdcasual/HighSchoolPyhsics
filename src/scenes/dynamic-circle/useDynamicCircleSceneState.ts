import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveDynamicReadings, type BoundaryType, type DynamicCircleMode } from './model'

export type DynamicCircleSceneState = {
  mode: DynamicCircleMode
  boundary: BoundaryType
  B: number
  v: number
  thetaDeg: number
  y0: number
  xBound: number
  triangleX: number
  triangleHeight: number
  circleCenterX: number
  circleRadius: number
  sweep: boolean
  showCenter: boolean
  elapsed: number
  running: boolean
  readings: ReturnType<typeof deriveDynamicReadings>
  setMode: (mode: DynamicCircleMode) => void
  setBoundary: (boundary: BoundaryType) => void
  setB: (value: number) => void
  setV: (value: number) => void
  setThetaDeg: (value: number) => void
  setY0: (value: number) => void
  setXBound: (value: number) => void
  setTriangleX: (value: number) => void
  setTriangleHeight: (value: number) => void
  setCircleCenterX: (value: number) => void
  setCircleRadius: (value: number) => void
  setSweep: (value: boolean) => void
  setShowCenter: (value: boolean) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Omit<DynamicCircleSceneState, 'readings' | 'setMode' | 'setBoundary' | 'setB' | 'setV' | 'setThetaDeg' | 'setY0' | 'setXBound' | 'setTriangleX' | 'setTriangleHeight' | 'setCircleCenterX' | 'setCircleRadius' | 'setSweep' | 'setShowCenter' | 'toggleRunning' | 'reset'>

const INITIAL_SIMULATION: Simulation = {
  mode: 'scaling', boundary: 'straight', B: 0.1, v: 12, thetaDeg: 0, y0: 330,
  xBound: 480, triangleX: 480, triangleHeight: 300, circleCenterX: 380, circleRadius: 120,
  sweep: false, showCenter: true, elapsed: 0, running: true,
}

export function useDynamicCircleSceneState(): DynamicCircleSceneState {
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
  const readings = useMemo(() => deriveDynamicReadings({
    ...simulation,
    circleCenter: { x: simulation.circleCenterX, y: simulation.y0 },
  }), [simulation])

  return {
    ...simulation,
    readings,
    setMode: (mode) => commit({ mode }),
    setBoundary: (boundary) => commit({ boundary }),
    setB: (B) => commit({ B }),
    setV: (v) => commit({ v }),
    setThetaDeg: (thetaDeg) => commit({ thetaDeg }),
    setY0: (y0) => commit({ y0 }),
    setXBound: (xBound) => commit({ xBound }),
    setTriangleX: (triangleX) => commit({ triangleX }),
    setTriangleHeight: (triangleHeight) => commit({ triangleHeight }),
    setCircleCenterX: (circleCenterX) => commit({ circleCenterX }),
    setCircleRadius: (circleRadius) => commit({ circleRadius }),
    setSweep: (sweep) => commit({ sweep }),
    setShowCenter: (showCenter) => commit({ showCenter }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => {
      lastTimestampRef.current = null
      const next = { ...INITIAL_SIMULATION }
      simulationRef.current = next
      setSimulation(next)
    },
  }
}
