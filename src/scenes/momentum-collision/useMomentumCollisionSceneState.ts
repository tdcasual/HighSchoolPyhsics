import { useEffect, useRef, useState } from 'react'
import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { getPlaybackRate } from '../../scene3d/playbackRate'
import { COLLISION_PRESETS, glidersAt, runEnded, type CollisionParams } from './model'

export type MomentumCollisionSceneState = {
  params: CollisionParams
  setParams: (patch: Partial<CollisionParams>) => void
  applyPreset: (key: keyof typeof COLLISION_PRESETS) => void
  time: number
  ended: boolean
  running: boolean
  toggleRunning: () => void
  /** Pause and advance 0.1 s. */
  step: () => void
  reset: () => void
}

function presetParams(key: keyof typeof COLLISION_PRESETS): CollisionParams {
  const { massA, massB, velocityA, velocityB, kind } = COLLISION_PRESETS[key]
  return { massA, massB, velocityA, velocityB, kind }
}

export function useMomentumCollisionSceneState(): MomentumCollisionSceneState {
  const [params, setParamsState] = useState<CollisionParams>(() => recall('momentum-collision.params', presetParams('swap')))
  useRemember('momentum-collision', { params })
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const ended = runEnded(glidersAt(params, time))
  const live = useRef({ params, time })
  useEffect(() => {
    live.current = { params, time }
  })

  useEffect(() => {
    if (!running) return
    let frameId = 0
    let previous: number | null = null
    const frame = (now: number) => {
      if (previous !== null) {
        const next = live.current.time + Math.min(0.05, (now - previous) / 1000) * getPlaybackRate()
        live.current = { ...live.current, time: next }
        setTime(next)
        if (runEnded(glidersAt(live.current.params, next))) {
          setRunning(false)
          return
        }
      }
      previous = now
      frameId = requestAnimationFrame(frame)
    }
    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [running])

  const restart = (next: CollisionParams) => {
    setParamsState(next)
    setRunning(false)
    setTime(0)
  }

  return {
    params,
    setParams: (patch) => restart({ ...params, ...patch }),
    applyPreset: (key) => restart(presetParams(key)),
    time,
    ended,
    running,
    toggleRunning: () => {
      if (ended) {
        setTime(0)
        setRunning(true)
        return
      }
      setRunning((value) => !value)
    },
    step: () => {
      setRunning(false)
      if (!ended) setTime((value) => value + 0.1)
    },
    reset: () => {
      setRunning(false)
      setTime(0)
    },
  }
}
