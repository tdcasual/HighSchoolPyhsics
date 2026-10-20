import { useEffect, useRef, useState } from 'react'
import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { getPlaybackRate } from '../../scene3d/playbackRate'
import { advanceMotion, energiesOf, releaseMotion, type EnergyMotion, type EnergyParams } from './model'

export type EnergySample = { t: number; kinetic: number; potential: number; mechanical: number }

export type MechanicalEnergySceneState = {
  params: EnergyParams
  setParams: (patch: Partial<EnergyParams>) => void
  motion: EnergyMotion
  history: EnergySample[]
  running: boolean
  toggleRunning: () => void
  /** Pause and advance 0.1 s. */
  step: () => void
  reset: () => void
}

const DEFAULT_PARAMS: EnergyParams = { mass: 0.5, releaseHeight: 1.5, mu: 0 }
const HISTORY_SECONDS = 12

function sample(p: EnergyParams, motion: EnergyMotion): EnergySample {
  const e = energiesOf(p, motion)
  return { t: motion.t, kinetic: e.kinetic, potential: e.potential, mechanical: e.mechanical }
}

export function useMechanicalEnergySceneState(): MechanicalEnergySceneState {
  const [params, setParamsState] = useState<EnergyParams>(() => recall('mechanical-energy.params', DEFAULT_PARAMS))
  useRemember('mechanical-energy', { params })
  const [motion, setMotion] = useState<EnergyMotion>(() => releaseMotion(params))
  const [history, setHistory] = useState<EnergySample[]>(() => [sample(params, releaseMotion(params))])
  const [running, setRunning] = useState(false)
  const live = useRef({ params, motion })
  useEffect(() => {
    live.current = { params, motion }
  })

  const advance = (seconds: number) => {
    const next = advanceMotion(live.current.params, live.current.motion, seconds)
    live.current = { ...live.current, motion: next }
    setMotion(next)
    setHistory((previous) => [...previous.filter((s) => s.t >= next.t - HISTORY_SECONDS), sample(live.current.params, next)])
    return next
  }
  const advanceRef = useRef(advance)
  useEffect(() => {
    advanceRef.current = advance
  })

  useEffect(() => {
    if (!running) return
    let frameId = 0
    let previous: number | null = null
    const frame = (now: number) => {
      if (previous !== null) {
        const next = advanceRef.current(Math.min(0.05, (now - previous) / 1000) * getPlaybackRate())
        if (next.stopped) {
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

  const restart = (p: EnergyParams) => {
    const start = releaseMotion(p)
    setRunning(false)
    setMotion(start)
    setHistory([sample(p, start)])
  }

  return {
    params,
    setParams: (patch) => {
      const next = { ...params, ...patch }
      setParamsState(next)
      restart(next)
    },
    motion,
    history,
    running,
    toggleRunning: () => {
      if (motion.stopped) {
        restart(params)
        setRunning(true)
        return
      }
      setRunning((value) => !value)
    },
    step: () => {
      setRunning(false)
      advance(0.1)
    },
    reset: () => restart(params),
  }
}
