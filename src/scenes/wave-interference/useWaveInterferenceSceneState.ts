import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSimulationClock } from '../../simulation/useSimulationClock'
import {
  DEFAULT_PARAMS,
  type WaveParams,
  type Observer,
  type Vec2,
  OBSERVER_DEFAULT,
  createObserverBuffer,
  type ObserverBuffer,
  ringToArrays,
} from './model'

export type WaveInterferenceSceneState = WaveParams & {
  showChart: boolean
  isPlaying: boolean
  playSpeed: number
  observer: Observer | null
  observerBuffer: ObserverBuffer | null
  showConstructive: boolean
  showDestructive: boolean
  setWavelength1: (v: number) => void
  setWavelength2: (v: number) => void
  setAmplitude1: (v: number) => void
  setAmplitude2: (v: number) => void
  setPhaseDiff: (v: number) => void
  setSource1: (v: Vec2) => void
  setSource2: (v: Vec2) => void
  toggleChart: () => void
  togglePlay: () => void
  setPlaySpeed: (v: number) => void
  setObserver: (v: Observer | null) => void
  setObserverBuffer: (b: ObserverBuffer | null) => void
  toggleConstructive: () => void
  toggleDestructive: () => void
  /** Pause and advance a quarter period of source S₁. */
  step: () => void
  /** Simulated time shared by the wave surface and the observer; the clock advances it. */
  time: { current: number }
  /** Bumped by 单步 and 重置 so the paused canvas redraws. */
  frameVersion: number
  reset: () => void
  resetVersion: number
  _tickSyncRef: { current: () => void }
}

const SYNC_INTERVAL = 6

export function useWaveInterferenceSceneState(): WaveInterferenceSceneState {
  const [params, setParams] = useState<WaveParams>(() => recall('wave-interference.params', DEFAULT_PARAMS))
  const [showChart, setShowChart] = useState(() => recall('wave-interference.showChart', true))
  const [playSpeed, setPlaySpeedState] = useState(() => recall('wave-interference.playSpeed', 0.5))
  const [observer, setObserver] = useState<Observer | null>({
    ...OBSERVER_DEFAULT,
    history: [],
    history1: [],
    history2: [],
    historyTimes: [],
    time: 0,
  })
  const [showConstructive, setShowConstructive] = useState(() => recall('wave-interference.showConstructive', true))
  const [showDestructive, setShowDestructive] = useState(() => recall('wave-interference.showDestructive', true))
  useRemember('wave-interference', { params, showChart, playSpeed, showConstructive, showDestructive })
  const [resetVersion, setResetVersion] = useState(0)
  const [frameVersion, setFrameVersion] = useState(0)
  const timeRef = useRef(0)
  // The scene's own 播放速度 slider sets the pace (no shell slow motion on top of it).
  const clock = useSimulationClock({
    initiallyRunning: true,
    honourPlaybackRate: false,
    timeScale: playSpeed,
    stepSeconds: params.wavelength1 / params.waveSpeed / 4,
    advance: (dt) => {
      timeRef.current += dt
    },
  })

  // Mutable ring buffer — animation loop writes here, no React state churn
  const [observerBuffer, setObserverBufferState] = useState<ObserverBuffer | null>(
    () => createObserverBuffer(OBSERVER_DEFAULT.x, OBSERVER_DEFAULT.z),
  )
  const bufferRef = useRef<ObserverBuffer | null>(observerBuffer)

  // Throttle counter: only sync to React state every N frames
  const syncCounterRef = useRef(0)

  const syncBufferToState = useCallback(() => {
    const buf = bufferRef.current
    if (!buf) {
      setObserver(null)
      setObserverBufferState(null)
      return
    }
    const { history, history1, history2, historyTimes } = ringToArrays(buf)
    setObserver({ x: buf.x, z: buf.z, history, history1, history2, historyTimes, time: buf.time })
    setObserverBufferState(buf)
  }, [])

  const setObserverBuffer = useCallback((b: ObserverBuffer | null) => {
    bufferRef.current = b
    syncCounterRef.current = 0
    syncBufferToState()
  }, [syncBufferToState])

  const tickSync = useCallback(() => {
    syncCounterRef.current++
    if (syncCounterRef.current >= SYNC_INTERVAL) {
      syncCounterRef.current = 0
      syncBufferToState()
    }
  }, [syncBufferToState])

  // Expose tickSync via a stable ref so the animation loop can call it
  const tickSyncRef = useRef(tickSync)
  useEffect(() => { tickSyncRef.current = tickSync }, [tickSync])

  const setWavelength1 = useCallback((v: number) => setParams(p => ({ ...p, wavelength1: v })), [])
  const setWavelength2 = useCallback((v: number) => setParams(p => ({ ...p, wavelength2: v })), [])
  const setAmplitude1 = useCallback((v: number) => setParams(p => ({ ...p, amplitude1: v })), [])
  const setAmplitude2 = useCallback((v: number) => setParams(p => ({ ...p, amplitude2: v })), [])
  const setPhaseDiff = useCallback((v: number) => setParams(p => ({ ...p, phaseDiff: v })), [])
  const setSource1 = useCallback((v: Vec2) => setParams(p => ({ ...p, source1: v })), [])
  const setSource2 = useCallback((v: Vec2) => setParams(p => ({ ...p, source2: v })), [])
  const toggleChart = useCallback(() => setShowChart(p => !p), [])
  const setPlaySpeed = useCallback((v: number) => setPlaySpeedState(v), [])
  const toggleConstructive = useCallback(() => setShowConstructive(p => !p), [])
  const toggleDestructive = useCallback(() => setShowDestructive(p => !p), [])

  const step = () => {
    clock.step()
    setFrameVersion((version) => version + 1)
  }

  const reset = () => {
    setParams(DEFAULT_PARAMS)
    setResetVersion((version) => version + 1)
    setShowChart(true)
    timeRef.current = 0
    setFrameVersion((version) => version + 1)
    clock.play()
    setPlaySpeedState(0.5)
    bufferRef.current = createObserverBuffer(OBSERVER_DEFAULT.x, OBSERVER_DEFAULT.z)
    syncCounterRef.current = 0
    syncBufferToState()
    setShowConstructive(true)
    setShowDestructive(true)
  }

  return {
    ...params,
    step,
    time: timeRef,
    frameVersion,
    showChart,
    isPlaying: clock.running,
    playSpeed,
    observer,
    observerBuffer,
    showConstructive,
    showDestructive,
    setWavelength1,
    setWavelength2,
    setAmplitude1,
    setAmplitude2,
    setPhaseDiff,
    setSource1,
    setSource2,
    toggleChart,
    togglePlay: clock.toggle,
    setPlaySpeed,
    setObserver,
    setObserverBuffer,
    toggleConstructive,
    toggleDestructive,
    reset,
    resetVersion,
    _tickSyncRef: tickSyncRef,
  }
}
