import { useEffect, useRef } from 'react'
import { getPlaybackRate } from '../scene3d/playbackRate'

/** Longest frame integrated at once, so a background tab or a stall does not jump ahead. */
export const MAX_FRAME_SECONDS = 0.05

export type AnimationLoopOptions = {
  /** Scale real time by the shell's 1× / ½× / ¼× slow motion (default true). */
  honourPlaybackRate?: boolean
  /** Extra time scale on top of the playback rate. */
  timeScale?: number
  /** Longest real frame integrated at once (default 0.05 s). */
  maxFrameSeconds?: number
}

/**
 * The one requestAnimationFrame loop scenes share: while `active`, calls `onFrame(dt)` with the
 * frame time capped and scaled by slow motion. useSimulationClock builds play / pause / 单步 on
 * it; scenes whose state machine owns its own `running` flag (cart, instruments) use it directly.
 */
export function useAnimationLoop(active: boolean, onFrame: (dt: number) => void, options: AnimationLoopOptions = {}): void {
  const latest = useRef({ onFrame, options })
  useEffect(() => {
    latest.current = { onFrame, options }
  })

  useEffect(() => {
    if (!active) return
    let frame = 0
    let previous: number | null = null
    const tick = (now: number) => {
      if (previous !== null) {
        const { honourPlaybackRate = true, timeScale = 1, maxFrameSeconds = MAX_FRAME_SECONDS } = latest.current.options
        const real = Math.min(maxFrameSeconds, Math.max(0, now - previous) / 1000)
        const dt = real * (honourPlaybackRate ? getPlaybackRate() : 1) * timeScale
        if (dt > 0) latest.current.onFrame(dt)
      }
      previous = now
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active])
}
