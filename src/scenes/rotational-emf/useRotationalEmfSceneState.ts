import { useEffect, useMemo, useRef, useState } from 'react'
import {
  deriveRotationalEmfReadout,
  formatAngleDegrees,
  formatEmfMagnitude,
  ROTATIONAL_EMF_SCENARIO_LABELS,
  ROTATIONAL_EMF_VIEW_LABELS,
  type RotationalEmfScenario,
  type RotationalEmfViewMode,
} from './model'

const DEFAULT_SCENARIO: RotationalEmfScenario = 'rod'
const DEFAULT_VIEW_MODE: RotationalEmfViewMode = 'main'
const DEFAULT_MAGNETIC_FIELD_T = 1
const DEFAULT_ANGULAR_SPEED = 1
const DEFAULT_EFFECTIVE_LENGTH_M = 1
const DEFAULT_ANGLE_RAD = 0
const ANGLE_STEP_SCALE = Math.PI / 180

export type RotationalEmfSceneState = {
  scenario: RotationalEmfScenario
  setScenario: (value: RotationalEmfScenario) => void
  scenarioLabel: string
  viewMode: RotationalEmfViewMode
  setViewMode: (value: RotationalEmfViewMode) => void
  viewLabel: string
  magneticFieldT: number
  setMagneticFieldT: (value: number) => void
  angularSpeed: number
  setAngularSpeed: (value: number) => void
  effectiveLengthM: number
  setEffectiveLengthM: (value: number) => void
  angleRad: number
  angleLabel: string
  running: boolean
  toggleRunning: () => void
  reset: () => void
  emfMagnitudeV: number
  emfMagnitudeLabel: string
}

export function useRotationalEmfSceneState(): RotationalEmfSceneState {
  const [scenario, setScenario] = useState<RotationalEmfScenario>(DEFAULT_SCENARIO)
  const [viewMode, setViewMode] = useState<RotationalEmfViewMode>(DEFAULT_VIEW_MODE)
  const [magneticFieldT, setMagneticFieldT] = useState(DEFAULT_MAGNETIC_FIELD_T)
  const [angularSpeed, setAngularSpeed] = useState(DEFAULT_ANGULAR_SPEED)
  const [effectiveLengthM, setEffectiveLengthM] = useState(DEFAULT_EFFECTIVE_LENGTH_M)
  const [angleRad, setAngleRad] = useState(DEFAULT_ANGLE_RAD)
  const [running, setRunning] = useState(false)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) {
      return
    }

    const tick = () => {
      setAngleRad((current) => current + angularSpeed * ANGLE_STEP_SCALE)
      frameRef.current = window.requestAnimationFrame(tick)
    }

    frameRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [angularSpeed, running])

  const readout = useMemo(
    () => deriveRotationalEmfReadout({ scenario, magneticFieldT, angularSpeed, effectiveLengthM, angleRad }),
    [angleRad, angularSpeed, effectiveLengthM, magneticFieldT, scenario],
  )

  const reset = () => {
    setScenario(DEFAULT_SCENARIO)
    setViewMode(DEFAULT_VIEW_MODE)
    setMagneticFieldT(DEFAULT_MAGNETIC_FIELD_T)
    setAngularSpeed(DEFAULT_ANGULAR_SPEED)
    setEffectiveLengthM(DEFAULT_EFFECTIVE_LENGTH_M)
    setAngleRad(DEFAULT_ANGLE_RAD)
    setRunning(false)
  }

  return {
    scenario,
    setScenario,
    scenarioLabel: ROTATIONAL_EMF_SCENARIO_LABELS[scenario],
    viewMode,
    setViewMode,
    viewLabel: ROTATIONAL_EMF_VIEW_LABELS[viewMode],
    magneticFieldT,
    setMagneticFieldT,
    angularSpeed,
    setAngularSpeed,
    effectiveLengthM,
    setEffectiveLengthM,
    angleRad,
    angleLabel: formatAngleDegrees(angleRad),
    running,
    toggleRunning: () => setRunning((value) => !value),
    reset,
    emfMagnitudeV: readout.emfMagnitudeV,
    emfMagnitudeLabel: formatEmfMagnitude(readout.emfMagnitudeV),
  }
}
