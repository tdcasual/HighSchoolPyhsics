import { rememberFields, useRememberFields } from '../../app/sceneMemory/sceneMemory'
import { useMemo, useState } from 'react'
import { useSimulationClock } from '../../simulation/useSimulationClock'
import {
  DEFAULT_XY_SETTINGS,
  deriveMeasurement,
  deriveXYConclusion,
  type BasicWaveform,
  type MeasurementReadout,
  type OscilloscopeMode,
  type XYSettings,
  xyPresetSettings,
} from './model'

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
  /** Pause and sweep the beam one horizontal division (a tenth of the X-Y cycle). */
  step: () => void
  reset: () => void
}

type Simulation = Pick<
  Oscilloscope3dSceneState,
  | 'mode'
  | 'selectedPart'
  | 'wave'
  | 'amplitudeV'
  | 'frequencyHz'
  | 'voltsDiv'
  | 'timeDiv'
  | 'trigger'
  | 'beamSpeed'
  | 'xy'
  | 'elapsed'
>

const INITIAL_SIMULATION: Simulation = {
  mode: 'structure',
  selectedPart: null,
  wave: 'sine',
  amplitudeV: 2,
  frequencyHz: 200,
  voltsDiv: 1,
  timeDiv: 1,
  trigger: true,
  beamSpeed: 1,
  xy: DEFAULT_XY_SETTINGS,
  elapsed: 0,
}

/** Teacher-set parameters restored when the scene is opened again (run state is not). */
const REMEMBERED_FIELDS = [
  'mode',
  'wave',
  'amplitudeV',
  'frequencyHz',
  'voltsDiv',
  'timeDiv',
  'trigger',
  'beamSpeed',
  'xy',
] as const

export function useOscilloscope3dSceneState(): Oscilloscope3dSceneState {
  const [simulation, setSimulation] = useState<Simulation>(() =>
    rememberFields('oscilloscope-3d', INITIAL_SIMULATION, REMEMBERED_FIELDS),
  )
  useRememberFields('oscilloscope-3d', simulation, REMEMBERED_FIELDS)
  // The 扫描速度 control scales the sweep; 单步 = one horizontal division (deriveBeamProgress
  // sweeps 10 per period: timeDiv ms each, or 1 s per X-Y cycle).
  const clock = useSimulationClock({
    // 结构认知 is about the parts; the sweep runs from 扫描原理 on.
    initiallyRunning: simulation.mode !== 'structure',
    timeScale: simulation.beamSpeed,
    stepSeconds: simulation.mode === 'xy' ? 0.1 : simulation.timeDiv / 1000,
    advance: (dt) => setSimulation((current) => ({ ...current, elapsed: current.elapsed + dt })),
  })
  const commit = (patch: Partial<Simulation>) => setSimulation((previous) => ({ ...previous, ...patch }))
  const measurement = useMemo(() => deriveMeasurement(simulation), [simulation])
  const xyConclusion = useMemo(() => deriveXYConclusion(simulation.xy), [simulation.xy])
  return {
    ...simulation,
    measurement,
    xyConclusion,
    setMode: (mode) => {
      commit({ mode, selectedPart: null })
      if (mode === 'structure') clock.pause()
      else clock.play()
    },
    setSelectedPart: (selectedPart) => commit({ selectedPart }),
    setWave: (wave) => commit({ wave }),
    setAmplitudeV: (amplitudeV) => commit({ amplitudeV }),
    setFrequencyHz: (frequencyHz) => commit({ frequencyHz }),
    setVoltsDiv: (voltsDiv) => commit({ voltsDiv }),
    setTimeDiv: (timeDiv) => commit({ timeDiv }),
    setTrigger: (trigger) => commit({ trigger }),
    setBeamSpeed: (beamSpeed) => commit({ beamSpeed }),
    setXY: (patch) => setSimulation((previous) => ({ ...previous, xy: { ...previous.xy, ...patch } })),
    applyXYPreset: (preset) =>
      setSimulation((previous) => ({
        ...previous,
        xy: preset === 'custom' ? { ...previous.xy, preset } : xyPresetSettings(preset),
      })),
    running: clock.running,
    toggleRunning: clock.toggle,
    step: clock.step,
    reset: () => {
      setSimulation({ ...INITIAL_SIMULATION, xy: { ...DEFAULT_XY_SETTINGS } })
      clock.pause()
    },
  }
}
