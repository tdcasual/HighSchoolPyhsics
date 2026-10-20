import { useEffect, useRef, useState } from 'react'
import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import type { PracticeState } from './practice'

/** Teacher-set fields every instrument scene restores when it is opened again (run state is not). */
export const REMEMBERED_PRACTICE_FIELDS = ['lesson', 'hints', 'showLabels', 'freeWork', 'position', 'workSize'] as const

/**
 * Holds an instrument scene's state: remembers the teacher's settings, runs the animation loop
 * while something moves (explode, a commanded move, the ratchet click) and exposes `commit`
 * for pure state transitions.
 */
export function usePracticeState<S extends PracticeState>(options: {
  pageId: string
  create: () => S
  /** Instrument-specific fields to remember in addition to REMEMBERED_PRACTICE_FIELDS. */
  remembered: readonly (keyof S & string)[]
  isAnimating: (state: S) => boolean
  stepMotion: (state: S, dt: number) => S
}) {
  const { pageId, isAnimating, stepMotion } = options
  const fields = [...REMEMBERED_PRACTICE_FIELDS, ...options.remembered] as readonly (keyof S & string)[]
  const [state, setState] = useState(() => rememberFields(pageId, options.create(), fields))
  useRememberFields(pageId, state, fields)
  const stateRef = useRef(state)
  const animating = isAnimating(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    if (!animating) return
    let frame = 0
    let last = 0
    const loop = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      const next = stepMotion(stateRef.current, dt)
      stateRef.current = next
      setState(next)
      if (isAnimating(next)) frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [animating, isAnimating, stepMotion])

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

  return { state, animating, commit, replace }
}
