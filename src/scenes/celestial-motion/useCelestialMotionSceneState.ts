import { useEffect, useRef, useState } from 'react'
import { playbackScale, scenarioOf, type BodyId, type OrbitMode } from './model'
import {
  applyPreset,
  createCelestialState,
  integrateCelestial,
  setBody,
  setMode,
  setView,
  stepCelestial,
  toggleCelestial,
  type CelestialPreset,
  type CelestialState,
  type CelestialView,
} from './state'

export function useCelestialMotionSceneState() {
  const [simulation, setSimulation] = useState(createCelestialState)
  const simulationRef = useRef(simulation)

  useEffect(() => {
    simulationRef.current = simulation
  }, [simulation])

  useEffect(() => {
    if (!simulation.running) return
    let frame = 0
    let last = 0
    const loop = (now: number) => {
      const frameDt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const current = simulationRef.current
      const next = integrateCelestial(current, frameDt * current.timeScale * playbackScale(scenarioOf(current)))
      simulationRef.current = next
      setSimulation(next)
      if (next.running) frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [simulation.running])

  const commit = (updater: (state: CelestialState) => CelestialState) => {
    setSimulation((previous) => {
      const next = updater(previous)
      simulationRef.current = next
      return next
    })
  }

  return {
    ...simulation,
    scenario: scenarioOf(simulation),
    toggleRunning: () => commit(toggleCelestial),
    step: () => commit(stepCelestial),
    reset: () => commit((state) => ({
      ...state,
      time: 0,
      running: false,
      finished: false,
      notice: '回到起点。轨道参数保持不变。',
    })),
    setMode: (mode: OrbitMode) => commit((state) => setMode(state, mode)),
    setBody: (body: BodyId) => commit((state) => setBody(state, body)),
    setR1: (r1: number) => commit((state) => ({ ...state, r1, finished: false })),
    setR2: (r2: number) => commit((state) => ({ ...state, r2, finished: false })),
    setPhase: (phaseDeg: number) => commit((state) => ({ ...state, phaseDeg, finished: false })),
    setInclination: (inclinationDeg: number) => commit((state) => ({ ...state, inclinationDeg, finished: false })),
    setTimeScale: (timeScale: number) => commit((state) => ({ ...state, timeScale, finished: false })),
    setView: (view: CelestialView) => commit((state) => setView(state, view)),
    setPreset: (preset: CelestialPreset) => commit((state) => applyPreset(state, preset)),
    toggleVectors: () => commit((state) => ({ ...state, showVectors: !state.showVectors })),
    toggleArea: () => commit((state) => ({ ...state, showArea: !state.showArea })),
    togglePlane: () => commit((state) => ({ ...state, showPlane: !state.showPlane })),
    toggleCorotate: () => commit((state) => ({ ...state, corotate: !state.corotate })),
  }
}

export type CelestialMotionSceneState = ReturnType<typeof useCelestialMotionSceneState>
