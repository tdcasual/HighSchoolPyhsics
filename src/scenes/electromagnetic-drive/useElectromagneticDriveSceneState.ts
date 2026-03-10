import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createElectromagneticDriveState,
  isElectromagneticDriveActive,
  resetElectromagneticDriveState,
  stepElectromagneticDriveState,
  type ElectromagneticDriveState,
} from './model'

export type ElectromagneticDriveSceneState = ElectromagneticDriveState & {
  start: () => void
  pause: () => void
  reset: () => void
}

type StateUpdater =
  | ElectromagneticDriveState
  | ((prev: ElectromagneticDriveState) => ElectromagneticDriveState)

const FIXED_STEP_MS = 1000 / 60
const MAX_ACCUMULATED_MS = FIXED_STEP_MS * 15
const STEP_EPSILON_MS = 0.001

export function useElectromagneticDriveSceneState(): ElectromagneticDriveSceneState {
  const [simulation, setSimulation] = useState(() => createElectromagneticDriveState())
  const simulationRef = useRef(simulation)
  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const accumulatedMsRef = useRef(0)

  const resetAnimationClock = useCallback(() => {
    lastTimestampRef.current = null
    accumulatedMsRef.current = 0
  }, [])

  const commitSimulation = useCallback((updater: StateUpdater) => {
    setSimulation((previous) => {
      const next = typeof updater === 'function'
        ? (updater as (prev: ElectromagneticDriveState) => ElectromagneticDriveState)(previous)
        : updater
      simulationRef.current = next
      return next
    })
  }, [])

  useEffect(() => {
    simulationRef.current = simulation
  }, [simulation])

  useEffect(() => {
    if (!isElectromagneticDriveActive(simulation) || frameRef.current !== null) {
      return
    }

    const tick = (timestampMs: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestampMs
      } else {
        const elapsedMs = Math.max(0, timestampMs - lastTimestampRef.current)
        lastTimestampRef.current = timestampMs
        accumulatedMsRef.current = Math.min(
          accumulatedMsRef.current + elapsedMs,
          MAX_ACCUMULATED_MS,
        )

        let next = simulationRef.current
        let advanced = false

        while (accumulatedMsRef.current + STEP_EPSILON_MS >= FIXED_STEP_MS) {
          next = stepElectromagneticDriveState(next)
          accumulatedMsRef.current = Math.max(0, accumulatedMsRef.current - FIXED_STEP_MS)
          advanced = true
        }

        if (advanced) {
          simulationRef.current = next
          setSimulation(next)
        }
      }

      if (isElectromagneticDriveActive(simulationRef.current)) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        frameRef.current = null
        resetAnimationClock()
      }
    }

    frameRef.current = requestAnimationFrame(tick)
  }, [resetAnimationClock, simulation])

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      resetAnimationClock()
    }
  }, [resetAnimationClock])

  const start = useCallback(() => {
    resetAnimationClock()
    commitSimulation((previous) => ({
      ...previous,
      isRunning: true,
    }))
  }, [commitSimulation, resetAnimationClock])

  const pause = useCallback(() => {
    commitSimulation((previous) => ({
      ...previous,
      isRunning: false,
    }))
  }, [commitSimulation])

  const reset = useCallback(() => {
    resetAnimationClock()
    commitSimulation((previous) => resetElectromagneticDriveState(previous))
  }, [commitSimulation, resetAnimationClock])

  return {
    ...simulation,
    start,
    pause,
    reset,
  }
}
