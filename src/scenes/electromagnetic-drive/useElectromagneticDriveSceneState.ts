import { getPlaybackRate } from '../../scene3d/playbackRate'
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
  /** Advance 0.1 s and hold that instant; cranking (if on) stays on for when it resumes. */
  step: () => void
  /** Time is held after 单步 until it resumes, stops or resets. */
  frozen: boolean
  resume: () => void
  reset: () => void
}

type StateUpdater =
  | ElectromagneticDriveState
  | ((prev: ElectromagneticDriveState) => ElectromagneticDriveState)

const FIXED_STEP_MS = 1000 / 60
const MAX_ACCUMULATED_MS = FIXED_STEP_MS * 15
const STEP_EPSILON_MS = 0.001
/** 单步: 0.1 s of fixed physics steps. */
const SINGLE_STEP_TICKS = 6

export function useElectromagneticDriveSceneState(): ElectromagneticDriveSceneState {
  const [simulation, setSimulation] = useState(() => createElectromagneticDriveState())
  const simulationRef = useRef(simulation)
  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const accumulatedMsRef = useRef(0)
  const [frozen, setFrozen] = useState(false)

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
    if (frozen || !isElectromagneticDriveActive(simulation) || frameRef.current !== null) {
      return
    }

    const tick = (timestampMs: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestampMs
      } else {
        const elapsedMs = Math.max(0, timestampMs - lastTimestampRef.current)
        lastTimestampRef.current = timestampMs
        accumulatedMsRef.current = Math.min(
          accumulatedMsRef.current + elapsedMs * getPlaybackRate(),
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
  }, [frozen, resetAnimationClock, simulation])

  // Freezing stops the loop already in flight.
  useEffect(() => {
    if (!frozen || frameRef.current === null) return
    cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    resetAnimationClock()
  }, [frozen, resetAnimationClock])

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
    setFrozen(false)
    resetAnimationClock()
    commitSimulation((previous) => ({
      ...previous,
      isRunning: true,
    }))
  }, [commitSimulation, resetAnimationClock])

  const pause = useCallback(() => {
    setFrozen(false)
    commitSimulation((previous) => ({
      ...previous,
      isRunning: false,
    }))
  }, [commitSimulation])

  const step = useCallback(() => {
    setFrozen(true)
    commitSimulation((previous) => {
      let next = previous
      for (let tick = 0; tick < SINGLE_STEP_TICKS; tick++) next = stepElectromagneticDriveState(next)
      return next
    })
  }, [commitSimulation])

  const resume = useCallback(() => {
    resetAnimationClock()
    setFrozen(false)
  }, [resetAnimationClock])

  const reset = useCallback(() => {
    setFrozen(false)
    resetAnimationClock()
    commitSimulation((previous) => resetElectromagneticDriveState(previous))
  }, [commitSimulation, resetAnimationClock])

  return {
    ...simulation,
    start,
    pause,
    step,
    frozen,
    resume,
    reset,
  }
}
