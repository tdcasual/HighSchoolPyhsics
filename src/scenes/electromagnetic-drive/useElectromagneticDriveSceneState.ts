import { useRef, useState } from 'react'
import { useSimulationClock } from '../../simulation/useSimulationClock'
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
  /** Advance 0.1 s and hold that instant; cranking (if on, or from rest) continues on resume. */
  step: () => void
  /** Time is held after 单步 while the magnet or frame still moves. */
  frozen: boolean
  resume: () => void
  reset: () => void
  /** Time is flowing (cranking or coasting). */
  ticking: boolean
}

/** The model integrates in fixed 1/60 s steps. */
const FIXED_STEP_S = 1 / 60

/**
 * The clock runs while anything moves: cranking (isRunning) or coasting afterwards. 停止摇动
 * only stops the hand; time keeps flowing until the magnet and frame come to rest.
 */
export function useElectromagneticDriveSceneState(): ElectromagneticDriveSceneState {
  const [simulation, setSimulation] = useState(() => createElectromagneticDriveState())
  const simulationRef = useRef(simulation)
  const commit = (next: ElectromagneticDriveState) => {
    simulationRef.current = next
    setSimulation(next)
  }
  const clock = useSimulationClock({
    stepSeconds: 0.1,
    fixedStepSeconds: FIXED_STEP_S,
    // Keep real time on slow classroom machines (up to 15 physics steps per frame).
    maxFrameSeconds: 15 * FIXED_STEP_S,
    advance: () => {
      const next = stepElectromagneticDriveState(simulationRef.current)
      commit(next)
      return isElectromagneticDriveActive(next)
    },
  })

  return {
    ...simulation,
    ticking: clock.running,
    frozen: !clock.running && isElectromagneticDriveActive(simulation),
    start: () => {
      commit({ ...simulationRef.current, isRunning: true })
      clock.play()
    },
    // Coasting continues: the clock stops by itself once everything is at rest.
    pause: () => commit({ ...simulationRef.current, isRunning: false }),
    step: () => {
      // From rest there is nothing to step through, so 单步 starts cranking like 开始摇动.
      if (!isElectromagneticDriveActive(simulationRef.current)) commit({ ...simulationRef.current, isRunning: true })
      clock.step()
    },
    resume: clock.play,
    reset: () => {
      clock.pause()
      commit(resetElectromagneticDriveState(simulationRef.current))
    },
  }
}
