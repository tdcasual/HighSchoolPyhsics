import { useCallback, useEffect, useRef, useState } from 'react'
import { useAnimationLoop } from './useAnimationLoop'

export type SimulationClockOptions = {
  /**
   * Advances the scene by `dt` simulated seconds. Return false when the process has ended (the
   * rod reached the rails' end, the particle left the D-box); the clock then pauses itself.
   */
  advance: (dt: number) => boolean | void
  /** Simulated seconds per 单步 (key 'step'), e.g. T/4 or 0.1 s; not scaled by rate or timeScale. */
  stepSeconds: number
  initiallyRunning?: boolean
  /** Scale real time by the shell's 1× / ½× / ¼× slow motion (pair with SceneLayout timeControl). */
  honourPlaybackRate?: boolean
  /** Scene-specific time scale on top of the playback rate (e.g. a 时间缩放 slider). */
  timeScale?: number
  /** Integrate in fixed sub-steps of this many seconds (for physics that needs a constant dt). */
  fixedStepSeconds?: number
  /** Longest real frame integrated at once (default 0.05 s); slow machines fall behind beyond it. */
  maxFrameSeconds?: number
}

export type SimulationClock = {
  running: boolean
  play: () => void
  pause: () => void
  toggle: () => void
  /** Pause, then advance one 单步. */
  step: () => void
  /** Render continuously only while time runs. */
  frameloop: 'always' | 'demand'
}

/**
 * The time base every animated scene shares: play / pause / 单步, slow motion and fixed
 * sub-steps live here, so a scene only describes what happens in `dt` seconds.
 */
export function useSimulationClock(options: SimulationClockOptions): SimulationClock {
  const [running, setRunning] = useState(options.initiallyRunning ?? false)
  const optionsRef = useRef(options)
  const carryRef = useRef(0)
  useEffect(() => {
    optionsRef.current = options
  })

  /** Runs `seconds` of simulated time, in fixed sub-steps when asked; false once the process ends. */
  const run = useCallback((seconds: number): boolean => {
    const { advance, fixedStepSeconds } = optionsRef.current
    if (!fixedStepSeconds) return advance(seconds) !== false
    carryRef.current += seconds
    while (carryRef.current + 1e-9 >= fixedStepSeconds) {
      carryRef.current -= fixedStepSeconds
      if (advance(fixedStepSeconds) === false) {
        carryRef.current = 0
        return false
      }
    }
    return true
  }, [])

  useAnimationLoop(running, (dt) => {
    if (!run(dt)) setRunning(false)
  }, {
    honourPlaybackRate: options.honourPlaybackRate,
    timeScale: options.timeScale,
    maxFrameSeconds: options.maxFrameSeconds,
  })

  const step = useCallback(() => {
    setRunning(false)
    run(optionsRef.current.stepSeconds)
  }, [run])

  return {
    running,
    play: useCallback(() => setRunning(true), []),
    pause: useCallback(() => setRunning(false), []),
    toggle: useCallback(() => setRunning((value) => !value), []),
    step,
    frameloop: running ? 'always' : 'demand',
  }
}
