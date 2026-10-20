import { useEffect, useRef, useState } from 'react'
import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { getPlaybackRate } from '../../scene3d/playbackRate'
import { advancePendulum, releaseState, smallAnglePeriod, type PendulumParams, type PendulumState } from './model'

export type SimplePendulumSceneState = {
  params: PendulumParams
  setParams: (patch: Partial<PendulumParams>) => void
  state: PendulumState
  /** (t, x) samples of the horizontal displacement x = L·sinθ for the x-t chart. */
  history: Array<[number, number]>
  running: boolean
  toggleRunning: () => void
  /** Pause and advance a quarter of the small-angle period. */
  step: () => void
  reset: () => void
}

const DEFAULT_PARAMS: PendulumParams = { length: 1, amplitudeDeg: 10, gravity: 'earth', mass: 0.1 }

export function useSimplePendulumSceneState(): SimplePendulumSceneState {
  const [params, setParamsState] = useState<PendulumParams>(() => recall('simple-pendulum.params', DEFAULT_PARAMS))
  useRemember('simple-pendulum', { params })
  const [state, setState] = useState<PendulumState>(() => releaseState(params))
  const [history, setHistory] = useState<Array<[number, number]>>(() => [[0, params.length * Math.sin(releaseState(params).theta)]])
  const [running, setRunning] = useState(false)
  const live = useRef({ params, state })
  useEffect(() => {
    live.current = { params, state }
  })

  const advance = (seconds: number) => {
    const { params: p } = live.current
    const next = advancePendulum(p, live.current.state, seconds)
    live.current = { ...live.current, state: next }
    setState(next)
    const window = 3 * smallAnglePeriod(p)
    setHistory((previous) => [...previous.filter(([t]) => t >= next.t - window), [next.t, p.length * Math.sin(next.theta)]])
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
      if (previous !== null) advanceRef.current(Math.min(0.05, (now - previous) / 1000) * getPlaybackRate())
      previous = now
      frameId = requestAnimationFrame(frame)
    }
    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [running])

  const restart = (p: PendulumParams) => {
    const start = releaseState(p)
    setRunning(false)
    setState(start)
    setHistory([[0, p.length * Math.sin(start.theta)]])
  }

  return {
    params,
    setParams: (patch) => {
      const next = { ...params, ...patch }
      setParamsState(next)
      restart(next)
    },
    state,
    history,
    running,
    toggleRunning: () => setRunning((value) => !value),
    step: () => {
      setRunning(false)
      advance(smallAnglePeriod(params) / 4)
    },
    reset: () => restart(params),
  }
}
