import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useMemo, useState } from 'react'
import { useSimulationClock } from '../../simulation/useSimulationClock'
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
const FULL_ROTATION_RAD = Math.PI * 2

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
  /** Pause and turn by 15°. */
  step: () => void
  reset: () => void
  emfMagnitudeV: number
  emfMagnitudeLabel: string
}

export function useRotationalEmfSceneState(): RotationalEmfSceneState {
  const [scenario, setScenario] = useState<RotationalEmfScenario>(() => recall('rotational-emf.scenario', DEFAULT_SCENARIO))
  const [viewMode, setViewMode] = useState<RotationalEmfViewMode>(() => recall('rotational-emf.viewMode', DEFAULT_VIEW_MODE))
  const [magneticFieldT, setMagneticFieldT] = useState(() => recall('rotational-emf.magneticFieldT', DEFAULT_MAGNETIC_FIELD_T))
  const [angularSpeed, setAngularSpeed] = useState(() => recall('rotational-emf.angularSpeed', DEFAULT_ANGULAR_SPEED))
  const [effectiveLengthM, setEffectiveLengthM] = useState(() => recall('rotational-emf.effectiveLengthM', DEFAULT_EFFECTIVE_LENGTH_M))
  useRemember('rotational-emf', { scenario, viewMode, magneticFieldT, angularSpeed, effectiveLengthM })
  const [angleRad, setAngleRad] = useState(DEFAULT_ANGLE_RAD)
  // 单步 turns the rod 15°.
  const clock = useSimulationClock({
    stepSeconds: angularSpeed > 0 ? Math.PI / 12 / angularSpeed : 0,
    advance: (dt) => setAngleRad((current) => (current + angularSpeed * dt) % FULL_ROTATION_RAD),
  })

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
    clock.pause()
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
    running: clock.running,
    toggleRunning: clock.toggle,
    step: clock.step,
    reset,
    emfMagnitudeV: readout.emfMagnitudeV,
    emfMagnitudeLabel: formatEmfMagnitude(readout.emfMagnitudeV),
  }
}
