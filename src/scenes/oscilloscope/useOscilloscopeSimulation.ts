import { useState } from 'react'
import { useSimulationClock } from '../../simulation/useSimulationClock'

const DEFAULT_TIME_RATE = 1
const MIN_TIME_RATE = 0.05
const MAX_TIME_RATE = 3
/** At 1× the trace runs at a quarter of real time, so a 2 Hz signal is easy to follow. */
const BASE_TIME_SCALE = 0.25

export function clampTimeRate(timeRate: number): number {
  return Number.isFinite(timeRate) ? Math.min(MAX_TIME_RATE, Math.max(MIN_TIME_RATE, timeRate)) : DEFAULT_TIME_RATE
}

/** The oscilloscope's time cursor on the shared clock; 单步 adds `stepSeconds` of signal time. */
export function useOscilloscopeSimulation(timeRate: number, stepSeconds: number) {
  const [timeS, setTimeS] = useState(0)
  const clock = useSimulationClock({
    stepSeconds,
    timeScale: BASE_TIME_SCALE * clampTimeRate(timeRate),
    advance: (dt) => setTimeS((value) => value + dt),
  })
  return {
    clock,
    timeS,
    reset: () => {
      clock.pause()
      setTimeS(0)
    },
  }
}
