import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_XY_SETTINGS, deriveMeasurement, deriveXYConclusion, type BasicWaveform, type MeasurementReadout, type OscilloscopeMode, type XYSettings, xyPresetSettings } from './model'

export type Oscilloscope3dSceneState = {
  mode: OscilloscopeMode
  selectedPart: string | null
  wave: BasicWaveform
  amplitudeV: number
  frequencyHz: number
  voltsDiv: number
  timeDiv: number
  trigger: boolean
  beamSpeed: number
  xy: XYSettings
  elapsed: number
  running: boolean
  measurement: MeasurementReadout
  xyConclusion: string
  setMode: (mode: OscilloscopeMode) => void
  setSelectedPart: (part: string | null) => void
  setWave: (wave: BasicWaveform) => void
  setAmplitudeV: (value: number) => void
  setFrequencyHz: (value: number) => void
  setVoltsDiv: (value: number) => void
  setTimeDiv: (value: number) => void
  setTrigger: (value: boolean) => void
  setBeamSpeed: (value: number) => void
  setXY: (patch: Partial<XYSettings>) => void
  applyXYPreset: (preset: XYSettings['preset']) => void
  toggleRunning: () => void
  reset: () => void
}

type Simulation = Pick<Oscilloscope3dSceneState, 'mode' | 'selectedPart' | 'wave' | 'amplitudeV' | 'frequencyHz' | 'voltsDiv' | 'timeDiv' | 'trigger' | 'beamSpeed' | 'xy' | 'elapsed' | 'running'>

const INITIAL_SIMULATION: Simulation = {
  mode: 'structure', selectedPart: null, wave: 'sine', amplitudeV: 2, frequencyHz: 200,
  voltsDiv: 1, timeDiv: 1, trigger: true, beamSpeed: 1, xy: DEFAULT_XY_SETTINGS, elapsed: 0, running: true,
}

export function useOscilloscope3dSceneState(): Oscilloscope3dSceneState {
  const [simulation, setSimulation] = useState<Simulation>(INITIAL_SIMULATION)
  const simulationRef = useRef(simulation)
  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)

  useEffect(() => { simulationRef.current = simulation }, [simulation])
  useEffect(() => {
    if (!simulation.running || frameRef.current !== null) return
    const tick = (timestamp: number) => {
      const previous = lastTimestampRef.current
      lastTimestampRef.current = timestamp
      if (previous !== null) {
        const delta = Math.min(0.05, Math.max(0, timestamp - previous) / 1000)
        const next = { ...simulationRef.current, elapsed: simulationRef.current.elapsed + delta * simulationRef.current.beamSpeed }
        simulationRef.current = next
        setSimulation(next)
      }
      if (simulationRef.current.running) frameRef.current = requestAnimationFrame(tick)
      else frameRef.current = null
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      lastTimestampRef.current = null
    }
  }, [simulation.running])

  const commit = useCallback((patch: Partial<Simulation>) => {
    setSimulation((previous) => {
      const next = { ...previous, ...patch }
      simulationRef.current = next
      return next
    })
  }, [])
  const measurement = useMemo(() => deriveMeasurement(simulation), [simulation])
  const xyConclusion = useMemo(() => deriveXYConclusion(simulation.xy), [simulation.xy])
  return {
    ...simulation, measurement, xyConclusion,
    setMode: (mode) => commit({ mode, selectedPart: null }),
    setSelectedPart: (selectedPart) => commit({ selectedPart }),
    setWave: (wave) => commit({ wave }),
    setAmplitudeV: (amplitudeV) => commit({ amplitudeV }),
    setFrequencyHz: (frequencyHz) => commit({ frequencyHz }),
    setVoltsDiv: (voltsDiv) => commit({ voltsDiv }),
    setTimeDiv: (timeDiv) => commit({ timeDiv }),
    setTrigger: (trigger) => commit({ trigger }),
    setBeamSpeed: (beamSpeed) => commit({ beamSpeed }),
    setXY: (patch) => commit({ xy: { ...simulationRef.current.xy, ...patch } }),
    applyXYPreset: (preset) => commit({ xy: preset === 'custom' ? { ...simulationRef.current.xy, preset } : xyPresetSettings(preset) }),
    toggleRunning: () => { lastTimestampRef.current = null; commit({ running: !simulationRef.current.running }) },
    reset: () => {
      lastTimestampRef.current = null
      const next = { ...INITIAL_SIMULATION, xy: { ...DEFAULT_XY_SETTINGS } }
      simulationRef.current = next
      setSimulation(next)
    },
  }
}
