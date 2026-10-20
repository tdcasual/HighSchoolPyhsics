import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { useAnimatedState } from '../../simulation/useAnimatedState'
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
  // Explode and commanded moves are interface motion: they ignore slow motion.
  const { state, commit, replace } = useAnimatedState(
    () => rememberFields(pageId, options.create(), fields),
    stepMotion,
    isAnimating,
    { honourPlaybackRate: false, maxFrameSeconds: 0.1 },
  )
  useRememberFields(pageId, state, fields)
  const animating = isAnimating(state)

  return { state, animating, commit, replace }
}
