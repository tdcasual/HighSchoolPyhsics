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

export function useElectromagneticDriveSceneState(): ElectromagneticDriveSceneState {
  const [simulation, setSimulation] = useState(() => createElectromagneticDriveState())
  const simulationRef = useRef(simulation)
  const frameRef = useRef<number | null>(null)

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

    const tick = () => {
      const next = stepElectromagneticDriveState(simulationRef.current)
      simulationRef.current = next
      setSimulation(next)

      if (isElectromagneticDriveActive(next)) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        frameRef.current = null
      }
    }

    frameRef.current = requestAnimationFrame(tick)
  }, [simulation])

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [])

  const start = useCallback(() => {
    commitSimulation((previous) => ({
      ...previous,
      isRunning: true,
    }))
  }, [commitSimulation])

  const pause = useCallback(() => {
    commitSimulation((previous) => ({
      ...previous,
      isRunning: false,
    }))
  }, [commitSimulation])

  const reset = useCallback(() => {
    commitSimulation((previous) => resetElectromagneticDriveState(previous))
  }, [commitSimulation])

  return {
    ...simulation,
    start,
    pause,
    reset,
  }
}
