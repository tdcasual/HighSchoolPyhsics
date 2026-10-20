import { useEffect, useRef, useState } from 'react'
import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { getPlaybackRate } from '../../scene3d/playbackRate'
import { turntableReadings, type CircularMode, type ConicalParams, type TurntableParams } from './model'

/** Table radius (m); a slipping block is followed until it is this far beyond its start. */
export const TABLE_RADIUS_M = 0.6

export type CircularMotionSceneState = {
  mode: CircularMode
  setMode: (mode: CircularMode) => void
  turntable: TurntableParams
  setTurntable: (patch: Partial<TurntableParams>) => void
  conical: ConicalParams
  setConical: (patch: Partial<ConicalParams>) => void
  /** Rotation angle of the table / pendulum, rad. */
  phase: number
  /** How far a slipping block has slid along its tangent, m. */
  slipDistance: number
  /** Phase at which the block left the table (its tangent fixes the flight direction). */
  slipPhase: number
  running: boolean
  toggleRunning: () => void
  /** Pause and turn 15°. */
  step: () => void
  reset: () => void
}

const DEFAULT_TURNTABLE: TurntableParams = { mass: 0.2, radius: 0.3, omega: 3, mu: 0.4 }
const DEFAULT_CONICAL: ConicalParams = { mass: 0.1, length: 1, omega: 4 }

export function useCircularMotionSceneState(): CircularMotionSceneState {
  const [mode, setModeState] = useState<CircularMode>(() => recall('circular-motion.mode', 'turntable'))
  const [turntable, setTurntableState] = useState<TurntableParams>(() => recall('circular-motion.turntable', DEFAULT_TURNTABLE))
  const [conical, setConicalState] = useState<ConicalParams>(() => recall('circular-motion.conical', DEFAULT_CONICAL))
  useRemember('circular-motion', { mode, turntable, conical })

  const [phase, setPhase] = useState(0)
  const [slip, setSlip] = useState({ distance: 0, phase: 0 })
  const [running, setRunning] = useState(false)
  const live = useRef({ mode, turntable, conical, phase, slip })
  useEffect(() => {
    live.current = { mode, turntable, conical, phase, slip }
  })

  useEffect(() => {
    if (!running) return
    let frameId = 0
    let previous: number | null = null
    const frame = (now: number) => {
      if (previous !== null) {
        const dt = Math.min(0.05, (now - previous) / 1000) * getPlaybackRate()
        const current = live.current
        const omega = current.mode === 'turntable' ? current.turntable.omega : current.conical.omega
        const nextPhase = current.phase + omega * dt
        live.current = { ...current, phase: nextPhase }
        setPhase(nextPhase)
        if (current.mode === 'turntable' && turntableReadings(current.turntable).slips) {
          // Static friction cannot supply mω²r: the block leaves along the tangent (离心运动).
          const nextSlip = {
            distance: current.slip.distance + current.turntable.omega * current.turntable.radius * dt,
            phase: current.slip.distance > 0 ? current.slip.phase : current.phase,
          }
          live.current = { ...live.current, slip: nextSlip }
          setSlip(nextSlip)
          if (nextSlip.distance > TABLE_RADIUS_M) {
            setRunning(false)
            return
          }
        }
      }
      previous = now
      frameId = requestAnimationFrame(frame)
    }
    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [running])

  const restart = () => {
    setRunning(false)
    setSlip({ distance: 0, phase: 0 })
  }

  return {
    mode,
    setMode: (next) => {
      setModeState(next)
      restart()
    },
    turntable,
    setTurntable: (patch) => {
      setTurntableState((previous) => ({ ...previous, ...patch }))
      restart()
    },
    conical,
    setConical: (patch) => setConicalState((previous) => ({ ...previous, ...patch })),
    phase,
    slipDistance: slip.distance,
    slipPhase: slip.phase,
    running,
    toggleRunning: () => {
      if (slip.distance > TABLE_RADIUS_M) setSlip({ distance: 0, phase: 0 })
      setRunning((value) => !value)
    },
    step: () => {
      setRunning(false)
      setPhase((value) => value + Math.PI / 12)
    },
    reset: () => {
      restart()
      setPhase(0)
    },
  }
}
