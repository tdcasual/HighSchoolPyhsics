import { useEffect, useRef, useState } from 'react'
import { runFixedSteps } from './fixedSteps'
import { useAnimationLoop, type AnimationLoopOptions } from './useAnimationLoop'

export type AnimatedStateOptions = AnimationLoopOptions & {
  /** Step in fixed sub-steps of this many seconds (for physics that needs a constant dt). */
  fixedStepSeconds?: number
}

/**
 * State owned by a pure state machine that also moves on its own (a cart on the track, an
 * instrument easing to a reading): while `isActive(state)`, `step(state, dt)` runs every frame
 * through the shared animation loop. `commit` applies pure transitions; reads in event handlers
 * see the latest state through `current()`. With `fixedStepSeconds`, `resetCarry` drops the
 * fraction of a sub-step left over (call it when a transition restarts the process).
 */
export function useAnimatedState<S>(
  initial: S | (() => S),
  step: (state: S, dt: number) => S,
  isActive: (state: S) => boolean,
  options?: AnimatedStateOptions,
) {
  const [state, setState] = useState(initial)
  const stateRef = useRef(state)
  const carryRef = useRef(0)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useAnimationLoop(
    isActive(state),
    (dt) => {
      let next = stateRef.current
      const fixed = options?.fixedStepSeconds
      if (fixed) {
        carryRef.current = runFixedSteps(carryRef.current, dt, fixed, (h) => {
          next = step(next, h)
        }).carry
      } else {
        next = step(next, dt)
      }
      stateRef.current = next
      setState(next)
    },
    options,
  )

  const commit = (update: (current: S) => S) => {
    setState((previous) => {
      const next = update(previous)
      stateRef.current = next
      return next
    })
  }
  const replace = (next: S) => {
    stateRef.current = next
    setState(next)
  }
  const resetCarry = () => {
    carryRef.current = 0
  }
  return { state, commit, replace, current: () => stateRef.current, resetCarry }
}
