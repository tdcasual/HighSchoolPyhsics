import { useRef } from 'react'

/**
 * Wraps a `step(state, dt)` that needs a constant dt: the frame time is carried over and spent in
 * whole `fixedSeconds` sub-steps (for useAnimatedState; useSimulationClock has fixedStepSeconds).
 */
export function useFixedStepper<S>(step: (state: S, dt: number) => S, fixedSeconds: number) {
  const carryRef = useRef(0)
  const stepper = (state: S, dt: number): S => {
    carryRef.current += dt
    let next = state
    while (carryRef.current + 1e-9 >= fixedSeconds) {
      carryRef.current -= fixedSeconds
      next = step(next, fixedSeconds)
    }
    return next
  }
  return {
    stepper,
    resetCarry: () => {
      carryRef.current = 0
    },
  }
}
