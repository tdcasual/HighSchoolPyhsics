import { useCallback, useMemo, useState } from 'react'
import {
  DEFAULT_PARAMS,
  type WaveParams,
  type Observer,
  type Vec2,
  OBSERVER_DEFAULT,
  MAX_HISTORY,
} from './model'

export type WaveInterferenceSceneState = WaveParams & {
  showChart: boolean
  isPlaying: boolean
  playSpeed: number
  observer: Observer | null
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
  toggleConstructive: () => void
  toggleDestructive: () => void
  reset: () => void
}

export function useWaveInterferenceSceneState(): WaveInterferenceSceneState {
  const [params, setParams] = useState<WaveParams>(DEFAULT_PARAMS)
  const [showChart, setShowChart] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [playSpeed, setPlaySpeedState] = useState(0.5)
  const [observer, setObserver] = useState<Observer | null>({
    ...OBSERVER_DEFAULT,
    history: [],
    history1: [],
    history2: [],
  })
  const [showConstructive, setShowConstructive] = useState(true)
  const [showDestructive, setShowDestructive] = useState(true)

  const setWavelength1 = useCallback((v: number) => setParams(p => ({ ...p, wavelength1: v })), [])
  const setWavelength2 = useCallback((v: number) => setParams(p => ({ ...p, wavelength2: v })), [])
  const setAmplitude1 = useCallback((v: number) => setParams(p => ({ ...p, amplitude1: v })), [])
  const setAmplitude2 = useCallback((v: number) => setParams(p => ({ ...p, amplitude2: v })), [])
  const setPhaseDiff = useCallback((v: number) => setParams(p => ({ ...p, phaseDiff: v })), [])
  const setSource1 = useCallback((v: Vec2) => setParams(p => ({ ...p, source1: v })), [])
  const setSource2 = useCallback((v: Vec2) => setParams(p => ({ ...p, source2: v })), [])
  const toggleChart = useCallback(() => setShowChart(p => !p), [])
  const togglePlay = useCallback(() => setIsPlaying(p => !p), [])
  const setPlaySpeed = useCallback((v: number) => setPlaySpeedState(v), [])
  const toggleConstructive = useCallback(() => setShowConstructive(p => !p), [])
  const toggleDestructive = useCallback(() => setShowDestructive(p => !p), [])

  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS)
    setShowChart(true)
    setIsPlaying(true)
    setPlaySpeedState(0.5)
    setObserver({ ...OBSERVER_DEFAULT, history: [], history1: [], history2: [] })
    setShowConstructive(true)
    setShowDestructive(true)
  }, [])

  return {
    ...params,
    showChart,
    isPlaying,
    playSpeed,
    observer,
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
    togglePlay,
    setPlaySpeed,
    setObserver,
    toggleConstructive,
    toggleDestructive,
    reset,
  }
}
