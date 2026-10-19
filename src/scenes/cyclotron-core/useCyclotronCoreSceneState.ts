import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { getPlaybackRate } from '../../scene3d/playbackRate'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveCyclotronReadings, elapsedAtNextCrossing, type ParticleType } from './model'

export type CyclotronCoreSceneState = {
  particleType: ParticleType
  B: number
  U: number
  elapsed: number
  running: boolean
  readings: ReturnType<typeof deriveCyclotronReadings>
  setParticleType: (type: ParticleType) => void
  setB: (value: number) => void
  setU: (value: number) => void
  toggleRunning: () => void
  /** Pause and advance to the next gap crossing (one more acceleration). */
  step: () => void
  reset: () => void
}

type Simulation = Omit<CyclotronCoreSceneState, 'readings' | 'setParticleType' | 'setB' | 'setU' | 'toggleRunning' | 'step' | 'reset'>
const INITIAL_SIMULATION: Simulation = { particleType: 'proton', B: 3, U: 30, elapsed: 0, running: false }

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = ['particleType', 'B', 'U'] as const

export function useCyclotronCoreSceneState(): CyclotronCoreSceneState {
  const [simulation, setSimulation] = useState<Simulation>(() => rememberFields('cyclotron-core', INITIAL_SIMULATION, REMEMBERED_FIELDS))
  useRememberFields('cyclotron-core', simulation, REMEMBERED_FIELDS)
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
        const elapsed = current.elapsed + delta
        const nextReadings = deriveCyclotronReadings({
          type: current.particleType,
          B: current.B,
          U: current.U,
          elapsed,
          running: true,
        })
        const next = { ...current, elapsed, running: !nextReadings.extracted }
        simulationRef.current = next
        setSimulation(next)
        if (!next.running) {
          frameRef.current = null
          lastTimestampRef.current = null
          return
        }
      }

      frameRef.current = requestAnimationFrame(tick)
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

  const resetForParameterChange = useCallback((patch: Partial<Simulation>) => {
    setSimulation((previous) => {
      const next = { ...previous, ...patch, elapsed: 0, running: false }
      simulationRef.current = next
      return next
    })
  }, [])

  const readings = useMemo(() => deriveCyclotronReadings({
    type: simulation.particleType,
    B: simulation.B,
    U: simulation.U,
    elapsed: simulation.elapsed,
    running: simulation.running,
  }), [simulation])

  return {
    ...simulation,
    readings,
    setParticleType: (particleType) => resetForParameterChange({ particleType }),
    setB: (B) => resetForParameterChange({ B }),
    setU: (U) => resetForParameterChange({ U }),
    toggleRunning: () => {
      const current = simulationRef.current
      const currentReadings = deriveCyclotronReadings({
        type: current.particleType,
        B: current.B,
        U: current.U,
        elapsed: current.elapsed,
        running: current.running,
      })
      if (currentReadings.extracted) return
      lastTimestampRef.current = null
      commit({ running: !current.running })
    },
    step: () => {
      const current = simulationRef.current
      const currentReadings = deriveCyclotronReadings({ type: current.particleType, B: current.B, U: current.U, elapsed: current.elapsed, running: false })
      if (currentReadings.extracted) return
      lastTimestampRef.current = null
      commit({ running: false, elapsed: elapsedAtNextCrossing({ type: current.particleType, B: current.B, elapsed: current.elapsed }) })
    },
    reset: () => {
      lastTimestampRef.current = null
      const next = { ...INITIAL_SIMULATION }
      simulationRef.current = next
      setSimulation(next)
    },
  }
}
