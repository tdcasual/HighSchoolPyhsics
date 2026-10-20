import { useEffect, useRef, useState } from 'react'
import { useAnimationLoop, type AnimationLoopOptions } from './useAnimationLoop'

/**
 * State owned by a pure state machine that also moves on its own (a cart on the track, an
 * instrument easing to a reading): while `isActive(state)`, `step(state, dt)` runs every frame
 * through the shared animation loop. `commit` applies pure transitions; reads in event handlers
 * see the latest state through `current()`.
 */
export function useAnimatedState<S>(
  initial: S | (() => S),
  step: (state: S, dt: number) => S,
  isActive: (state: S) => boolean,
  options?: AnimationLoopOptions,
) {
  const [state, setState] = useState(initial)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useAnimationLoop(isActive(state), (dt) => {
    const next = step(stateRef.current, dt)
    stateRef.current = next
    setState(next)
  }, options)

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
  return { state, commit, replace, current: () => stateRef.current }
}
