import { useEffect, useRef, useState } from 'react'
import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { getPlaybackRate } from '../../scene3d/playbackRate'
import type { MediumKey, RefractionParams } from './model'

export const REFRACTION_PRESETS = {
  'air-glass': { label: '空气 → 玻璃', from: 'air', to: 'glass' },
  'glass-air': { label: '玻璃 → 空气', from: 'glass', to: 'air' },
  'water-air': { label: '水 → 空气', from: 'water', to: 'air' },
} as const satisfies Record<string, { label: string; from: MediumKey; to: MediumKey }>

/** Sweep speed when playing: the incidence angle grows by this many degrees per second. */
const SWEEP_DEG_PER_S = 8
const MAX_INCIDENCE = 89

export type LightRefractionSceneState = {
  params: RefractionParams
  setParams: (patch: Partial<RefractionParams>) => void
  running: boolean
  /** Play sweeps the incidence angle upwards, so the onset of total reflection can be watched. */
  toggleRunning: () => void
  /** Pause and add 5° to the angle of incidence. */
  step: () => void
  reset: () => void
}

const DEFAULT_PARAMS: RefractionParams = { from: 'air', to: 'glass', incidenceDeg: 30 }

export function useLightRefractionSceneState(): LightRefractionSceneState {
  const [params, setParamsState] = useState<RefractionParams>(() => recall('light-refraction.params', DEFAULT_PARAMS))
  useRemember('light-refraction', { params })
  const [running, setRunning] = useState(false)
  const live = useRef(params)
  useEffect(() => {
    live.current = params
  })

  useEffect(() => {
    if (!running) return
    let frameId = 0
    let previous: number | null = null
    const frame = (now: number) => {
      if (previous !== null) {
        const next = Math.min(MAX_INCIDENCE, live.current.incidenceDeg + Math.min(0.05, (now - previous) / 1000) * getPlaybackRate() * SWEEP_DEG_PER_S)
        live.current = { ...live.current, incidenceDeg: next }
        setParamsState(live.current)
        if (next >= MAX_INCIDENCE) {
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

  return {
    params,
    setParams: (patch) => {
      setRunning(false)
      setParamsState((previous) => ({ ...previous, ...patch }))
    },
    running,
    toggleRunning: () => {
      if (!running && params.incidenceDeg >= MAX_INCIDENCE) setParamsState((previous) => ({ ...previous, incidenceDeg: 0 }))
      setRunning((value) => !value)
    },
    step: () => {
      setRunning(false)
      setParamsState((previous) => ({ ...previous, incidenceDeg: Math.min(MAX_INCIDENCE, Math.floor(previous.incidenceDeg / 5 + 1e-9) * 5 + 5) }))
    },
    reset: () => {
      setRunning(false)
      setParamsState((previous) => ({ ...previous, incidenceDeg: DEFAULT_PARAMS.incidenceDeg }))
    },
  }
}
