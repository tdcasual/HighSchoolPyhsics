import { useCallback, useEffect, useRef, useState } from 'react'
import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { getPlaybackRate } from '../../scene3d/playbackRate'
import { PRESETS, STROBE_S, flightTime, type ProjectileParams } from './model'

export type ProjectileMotionSceneState = {
  params: ProjectileParams
  setSpeed: (value: number) => void
  setAngleDeg: (value: number) => void
  setHeight: (value: number) => void
  applyPreset: (preset: keyof typeof PRESETS) => void
  showComponents: boolean
  setShowComponents: (value: boolean) => void
  showStrobe: boolean
  setShowStrobe: (value: boolean) => void
  time: number
  running: boolean
  landed: boolean
  toggleRunning: () => void
  /** Pause and advance one strobe interval (0.1 s). */
  step: () => void
  reset: () => void
}

export function useProjectileMotionSceneState(): ProjectileMotionSceneState {
  const [params, setParams] = useState<ProjectileParams>(() => recall('projectile-motion.params', PRESETS.horizontal))
  const [showComponents, setShowComponents] = useState(() => recall('projectile-motion.showComponents', true))
  const [showStrobe, setShowStrobe] = useState(() => recall('projectile-motion.showStrobe', true))
  useRemember('projectile-motion', { params, showComponents, showStrobe })

  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const totalTime = flightTime(params)
  const landed = time >= totalTime - 1e-9
  const totalTimeRef = useRef(totalTime)
  const timeRef = useRef(time)
  useEffect(() => {
    totalTimeRef.current = totalTime
    timeRef.current = time
  })

  useEffect(() => {
    if (!running) return
    let frameId = 0
    let previous: number | null = null
    const frame = (now: number) => {
      if (previous !== null) {
        const delta = Math.min(0.05, (now - previous) / 1000) * getPlaybackRate()
        const next = Math.min(totalTimeRef.current, timeRef.current + delta)
        timeRef.current = next
        setTime(next)
        if (next >= totalTimeRef.current) {
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

  // Changing the launch restarts the throw.
  const relaunch = useCallback((next: ProjectileParams) => {
    setParams(next)
    setTime(0)
    setRunning(false)
  }, [])

  return {
    params,
    setSpeed: (speed) => relaunch({ ...params, speed }),
    setAngleDeg: (angleDeg) => relaunch({ ...params, angleDeg }),
    setHeight: (height) => relaunch({ ...params, height }),
    applyPreset: (preset) => relaunch(PRESETS[preset]),
    showComponents,
    setShowComponents,
    showStrobe,
    setShowStrobe,
    time,
    running,
    landed,
    toggleRunning: () => {
      if (landed) {
        setTime(0)
        setRunning(true)
        return
      }
      setRunning((value) => !value)
    },
    step: () => {
      setRunning(false)
      setTime((current) => Math.min(totalTime, Math.round((current + STROBE_S) / STROBE_S) * STROBE_S))
    },
    reset: () => {
      setRunning(false)
      setTime(0)
    },
  }
}
