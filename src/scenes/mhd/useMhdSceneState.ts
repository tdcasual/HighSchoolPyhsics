import { useEffect, useMemo, useState } from 'react'
import {
  deriveChargeSeparation,
  deriveMhdReadings,
  derivePolarizationTarget,
} from './model'

export type MhdSceneState = {
  magneticFieldT: number
  setMagneticFieldT: (value: number) => void
  plasmaVelocityMps: number
  setPlasmaVelocityMps: (value: number) => void
  plasmaDensityRatio: number
  setPlasmaDensityRatio: (value: number) => void
  electrodeGapM: number
  setElectrodeGapM: (value: number) => void
  conductivitySPerM: number
  setConductivitySPerM: (value: number) => void
  running: boolean
  toggleRunning: () => void
  reset: () => void
  phase: number
  chargeSeparation: number
  driveRatio: number
  voltageDisplayV: number
}

export function useMhdSceneState(): MhdSceneState {
  const [magneticFieldT, setMagneticFieldT] = useState(1.5)
  const [plasmaVelocityMps, setPlasmaVelocityMps] = useState(2000)
  const [plasmaDensityRatio, setPlasmaDensityRatio] = useState(1)
  const [electrodeGapM, setElectrodeGapM] = useState(0.4)
  const [conductivitySPerM, setConductivitySPerM] = useState(18)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState(0)
  const [chargeSeparation, setChargeSeparation] = useState(0)

  const driveRatio = useMemo(
    () =>
      derivePolarizationTarget({
        magneticFieldT,
        plasmaVelocityMps,
      }),
    [magneticFieldT, plasmaVelocityMps],
  )

  useEffect(() => {
    if (!running) {
      return
    }

    let frameId = 0
    let previous = performance.now()

    const frame = (now: number) => {
      const deltaS = Math.min(0.05, (now - previous) / 1000)
      previous = now
      setPhase((value) => (value + deltaS * 0.36) % 1)
      setChargeSeparation((value) =>
        deriveChargeSeparation({
          previous: value,
          deltaS,
          running: true,
          responseTimeS: 0.9,
          targetWhenRunning: driveRatio,
        }),
      )
      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [driveRatio, running])

  const readings = useMemo(
    () =>
      deriveMhdReadings({
        magneticFieldT,
        plasmaVelocityMps,
        electrodeGapM,
        conductivitySPerM: conductivitySPerM * plasmaDensityRatio,
      }),
    [conductivitySPerM, electrodeGapM, magneticFieldT, plasmaDensityRatio, plasmaVelocityMps],
  )

  const voltageDisplayV = Math.abs(readings.outputVoltageV)

  const reset = () => {
    setRunning(false)
    setPhase(0)
    setChargeSeparation(0)
  }

  return {
    magneticFieldT,
    setMagneticFieldT,
    plasmaVelocityMps,
    setPlasmaVelocityMps,
    plasmaDensityRatio,
    setPlasmaDensityRatio,
    electrodeGapM,
    setElectrodeGapM,
    conductivitySPerM,
    setConductivitySPerM,
    running,
    toggleRunning: () => setRunning((value) => !value),
    reset,
    phase,
    chargeSeparation,
    driveRatio,
    voltageDisplayV,
  }
}
