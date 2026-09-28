import { useEffect, useMemo, useState } from 'react'
import { deriveChargeSeparation, deriveMhdReadings, derivePolarizationTarget } from './model'
import type { MhdReadings } from './model'

const INITIAL_PARAMETERS = {
  magneticFieldT: 1.5,
  plasmaVelocityMps: 2000,
  plasmaDensityRatio: 1,
  electrodeGapM: 0.4,
  conductivitySPerM: 18,
  loadResistanceOhm: 0.3,
}

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
  loadResistanceOhm: number
  setLoadResistanceOhm: (value: number) => void
  running: boolean
  toggleRunning: () => void
  reset: () => void
  chargeSeparation: number
  driveRatio: number
  readings: MhdReadings
}

export function useMhdSceneState(): MhdSceneState {
  const [magneticFieldT, setMagneticFieldT] = useState(INITIAL_PARAMETERS.magneticFieldT)
  const [plasmaVelocityMps, setPlasmaVelocityMps] = useState(INITIAL_PARAMETERS.plasmaVelocityMps)
  const [plasmaDensityRatio, setPlasmaDensityRatio] = useState(INITIAL_PARAMETERS.plasmaDensityRatio)
  const [electrodeGapM, setElectrodeGapM] = useState(INITIAL_PARAMETERS.electrodeGapM)
  const [conductivitySPerM, setConductivitySPerM] = useState(INITIAL_PARAMETERS.conductivitySPerM)
  const [loadResistanceOhm, setLoadResistanceOhm] = useState(INITIAL_PARAMETERS.loadResistanceOhm)
  const [running, setRunning] = useState(false)
  const [chargeSeparation, setChargeSeparation] = useState(0)

  const driveRatio = useMemo(
    () => derivePolarizationTarget({ magneticFieldT, plasmaVelocityMps }),
    [magneticFieldT, plasmaVelocityMps],
  )
  const readings = useMemo(
    () =>
      deriveMhdReadings({
        magneticFieldT,
        plasmaVelocityMps,
        electrodeGapM,
        conductivitySPerM: conductivitySPerM * plasmaDensityRatio,
        loadResistanceOhm,
      }),
    [
      conductivitySPerM,
      electrodeGapM,
      loadResistanceOhm,
      magneticFieldT,
      plasmaDensityRatio,
      plasmaVelocityMps,
    ],
  )
  const loadVoltageRatio =
    Math.abs(readings.openCircuitVoltageV) > 0
      ? Math.abs(readings.outputVoltageV / readings.openCircuitVoltageV)
      : 0
  const polarizationTarget = driveRatio * loadVoltageRatio

  useEffect(() => {
    if (!running) return

    let frameId = 0
    let previous = performance.now()
    const frame = (now: number) => {
      const deltaS = Math.min(0.05, (now - previous) / 1000)
      previous = now
      setChargeSeparation((value) =>
        deriveChargeSeparation({
          previous: value,
          deltaS,
          running: true,
          responseTimeS: 0.9,
          targetWhenRunning: polarizationTarget,
        }),
      )
      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [polarizationTarget, running])

  const reset = () => {
    setRunning(false)
    setChargeSeparation(0)
    setMagneticFieldT(INITIAL_PARAMETERS.magneticFieldT)
    setPlasmaVelocityMps(INITIAL_PARAMETERS.plasmaVelocityMps)
    setPlasmaDensityRatio(INITIAL_PARAMETERS.plasmaDensityRatio)
    setElectrodeGapM(INITIAL_PARAMETERS.electrodeGapM)
    setConductivitySPerM(INITIAL_PARAMETERS.conductivitySPerM)
    setLoadResistanceOhm(INITIAL_PARAMETERS.loadResistanceOhm)
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
    loadResistanceOhm,
    setLoadResistanceOhm,
    running,
    toggleRunning: () => setRunning((value) => !value),
    reset,
    chargeSeparation,
    driveRatio,
    readings,
  }
}
