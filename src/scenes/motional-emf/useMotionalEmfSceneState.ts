import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useMemo, useRef, useState } from 'react'
import { useSimulationClock } from '../../simulation/useSimulationClock'
import { MOTIONAL_EMF_LAYOUT } from './layout'
import {
  advanceMotionOffset,
  advanceTravelProgress,
  deriveMotionalEmfReadings,
  formatAngleLabel,
  formatDiscussionMode,
  formatMagneticFieldDirection,
  formatMotionDirection,
  formatPolarityText,
  formatRelationText,
  formatRodVelocityAngle,
  formatVelocityPreset,
  type DiscussionMode,
  type MagneticFieldDirection,
  type MotionDirectionPreset,
  type MotionOffset,
  type RodVelocityAnglePreset,
  type VelocityPreset,
} from './model'

const DEFAULT_MAGNETIC_FIELD_T = 1
const DEFAULT_MAGNETIC_FIELD_DIRECTION: MagneticFieldDirection = 'up'
const DEFAULT_ROD_LENGTH_M = 0.5
const DEFAULT_SPEED_MPS = 2
const DEFAULT_ROD_ANGLE_DEG = 90
const DEFAULT_DISCUSSION_MODE: DiscussionMode = 'vb'
const DEFAULT_VELOCITY_PRESET: VelocityPreset = 'forward'
const DEFAULT_ROD_VELOCITY_ANGLE_DEG: RodVelocityAnglePreset = 90
const DEFAULT_MOTION_DIRECTION: MotionDirectionPreset = 'forward'
const MAX_DISPLAY_VOLTAGE = 2.5

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function createRestOffset(): MotionOffset {
  return [0, 0, 0]
}

export type MotionalEmfSceneState = {
  magneticFieldT: number
  setMagneticFieldT: (value: number) => void
  magneticFieldDirection: MagneticFieldDirection
  magneticFieldDirectionLabel: string
  setMagneticFieldDirection: (value: MagneticFieldDirection) => void
  rodLengthM: number
  setRodLengthM: (value: number) => void
  speedMps: number
  setSpeedMps: (value: number) => void
  rodAngleDeg: number
  setRodAngleDeg: (value: number) => void
  discussionMode: DiscussionMode
  discussionModeLabel: string
  setDiscussionMode: (value: DiscussionMode) => void
  velocityPreset: VelocityPreset
  setVelocityPreset: (value: VelocityPreset) => void
  velocityPresetLabel: string
  rodVelocityAngleDeg: RodVelocityAnglePreset
  setRodVelocityAngleDeg: (value: RodVelocityAnglePreset) => void
  rodVelocityAngleLabel: string
  motionDirection: MotionDirectionPreset
  setMotionDirection: (value: MotionDirectionPreset) => void
  motionDirectionLabel: string
  running: boolean
  toggleRunning: () => void
  /** Pause and advance 0.1 s of travel, keeping the rod's velocity as a frozen instant. */
  step: () => void
  steppedInMotion: boolean
  reset: () => void
  phase: number
  motionOffset: MotionOffset
  signedVoltageV: number
  voltageMagnitudeV: number
  effectiveCuttingRatio: number
  angleBetweenBLDeg: number
  angleBetweenLVDeg: number
  angleBetweenBVDeg: number
  angleBetweenBLLabel: string
  angleBetweenLVLabel: string
  angleBetweenBVLabel: string
  needleAngleRad: number
  polarityText: string
  relationText: string
}

type MotionParams = {
  speedMps: number
  discussionMode: DiscussionMode
  velocityPreset: VelocityPreset
  magneticFieldDirection: MagneticFieldDirection
  rodAngleDeg: number
  rodVelocityAngleDeg: RodVelocityAnglePreset
  motionDirection: MotionDirectionPreset
}

/** Single-step size: 0.1 s of travel. */
const STEP_S = 0.1

/** Moves the rod along its travel by `deltaS` seconds of motion. */
function advanceTravel(current: { phase: number; offset: MotionOffset }, deltaS: number, params: MotionParams) {
  const phase = advanceTravelProgress({
    previous: current.phase,
    deltaS,
    speedMps: params.speedMps,
    travelSpan: MOTIONAL_EMF_LAYOUT.motion.travelDistance,
  })
  const distanceDelta = (phase - current.phase) * MOTIONAL_EMF_LAYOUT.motion.travelDistance
  if (distanceDelta <= 0) return { phase, offset: current.offset }
  const offset = advanceMotionOffset({
    previous: current.offset,
    deltaS: 1,
    speedMps: distanceDelta,
    discussionMode: params.discussionMode,
    velocityPreset: params.velocityPreset,
    magneticFieldDirection: params.magneticFieldDirection,
    rodAngleDeg: params.rodAngleDeg,
    rodVelocityAngleDeg: params.rodVelocityAngleDeg,
    motionDirection: params.motionDirection,
  })
  return { phase, offset }
}

export function useMotionalEmfSceneState(): MotionalEmfSceneState {
  const [magneticFieldT, setMagneticFieldT] = useState(() => recall('motional-emf.magneticFieldT', DEFAULT_MAGNETIC_FIELD_T))
  const [magneticFieldDirection, setMagneticFieldDirection] = useState<MagneticFieldDirection>(() => recall('motional-emf.magneticFieldDirection', DEFAULT_MAGNETIC_FIELD_DIRECTION))
  const [rodLengthM, setRodLengthM] = useState(() => recall('motional-emf.rodLengthM', DEFAULT_ROD_LENGTH_M))
  const [speedMps, setSpeedMps] = useState(() => recall('motional-emf.speedMps', DEFAULT_SPEED_MPS))
  const [rodAngleDeg, setRodAngleDeg] = useState(() => recall('motional-emf.rodAngleDeg', DEFAULT_ROD_ANGLE_DEG))
  const [discussionMode, setDiscussionMode] = useState<DiscussionMode>(() => recall('motional-emf.discussionMode', DEFAULT_DISCUSSION_MODE))
  const [velocityPreset, setVelocityPreset] = useState<VelocityPreset>(() => recall('motional-emf.velocityPreset', DEFAULT_VELOCITY_PRESET))
  const [rodVelocityAngleDeg, setRodVelocityAngleDeg] = useState<RodVelocityAnglePreset>(() => recall('motional-emf.rodVelocityAngleDeg', DEFAULT_ROD_VELOCITY_ANGLE_DEG))
  const [motionDirection, setMotionDirection] = useState<MotionDirectionPreset>(() => recall('motional-emf.motionDirection', DEFAULT_MOTION_DIRECTION))
  useRemember('motional-emf', { magneticFieldT, magneticFieldDirection, rodLengthM, speedMps, rodAngleDeg, discussionMode, velocityPreset, rodVelocityAngleDeg, motionDirection })
  const [travel, setTravel] = useState(() => ({ phase: 0, offset: createRestOffset() }))
  // The clock reads and writes the travel synchronously (it must know when the rails end).
  const travelRef = useRef(travel)
  const moveTo = (next: { phase: number; offset: MotionOffset }) => {
    travelRef.current = next
    setTravel(next)
  }
  const { phase, offset: motionOffset } = travel

  // After 单步 the rod is shown as a frozen instant of the motion, so it keeps its velocity
  // (and its EMF) until it is played, reset or reaches the end.
  const [steppedInMotion, setSteppedInMotion] = useState(false)
  const motionParams: MotionParams = { speedMps, discussionMode, velocityPreset, magneticFieldDirection, rodAngleDeg, rodVelocityAngleDeg, motionDirection }
  const clock = useSimulationClock({
    stepSeconds: STEP_S,
    advance: (dt) => {
      if (speedMps <= 0) return false
      const next = advanceTravel(travelRef.current, dt, motionParams)
      moveTo(next)
      return next.phase < 1
    },
  })
  const running = clock.running

  const activeMotionSpeedMps = (running || steppedInMotion) && phase < 1 ? speedMps : 0

  const readings = useMemo(
    () =>
      deriveMotionalEmfReadings({
        magneticFieldT,
        magneticFieldDirection,
        rodLengthM,
        speedMps: activeMotionSpeedMps,
        rodAngleDeg,
        discussionMode,
        velocityPreset,
        rodVelocityAngleDeg,
        motionDirection,
      }),
    [activeMotionSpeedMps, discussionMode, magneticFieldDirection, magneticFieldT, motionDirection, rodAngleDeg, rodLengthM, rodVelocityAngleDeg, velocityPreset],
  )

  const reset = () => {
    clock.pause()
    setSteppedInMotion(false)
    moveTo({ phase: 0, offset: createRestOffset() })
    setMagneticFieldT(DEFAULT_MAGNETIC_FIELD_T)
    setMagneticFieldDirection(DEFAULT_MAGNETIC_FIELD_DIRECTION)
    setRodLengthM(DEFAULT_ROD_LENGTH_M)
    setSpeedMps(DEFAULT_SPEED_MPS)
    setRodAngleDeg(DEFAULT_ROD_ANGLE_DEG)
    setDiscussionMode(DEFAULT_DISCUSSION_MODE)
    setVelocityPreset(DEFAULT_VELOCITY_PRESET)
    setRodVelocityAngleDeg(DEFAULT_ROD_VELOCITY_ANGLE_DEG)
    setMotionDirection(DEFAULT_MOTION_DIRECTION)
  }

  return {
    magneticFieldT,
    setMagneticFieldT,
    magneticFieldDirection,
    magneticFieldDirectionLabel: formatMagneticFieldDirection(magneticFieldDirection),
    setMagneticFieldDirection,
    rodLengthM,
    setRodLengthM,
    speedMps,
    setSpeedMps,
    rodAngleDeg,
    setRodAngleDeg,
    discussionMode,
    discussionModeLabel: formatDiscussionMode(discussionMode),
    setDiscussionMode,
    velocityPreset,
    setVelocityPreset,
    velocityPresetLabel: formatVelocityPreset(velocityPreset),
    rodVelocityAngleDeg,
    setRodVelocityAngleDeg,
    rodVelocityAngleLabel: formatRodVelocityAngle(rodVelocityAngleDeg),
    motionDirection,
    setMotionDirection,
    motionDirectionLabel: formatMotionDirection(motionDirection),
    running,
    toggleRunning: () => {
      setSteppedInMotion(false)
      if (clock.running) {
        clock.pause()
        return
      }
      if (travelRef.current.phase >= 1) moveTo({ phase: 0, offset: createRestOffset() })
      if (speedMps > 0) clock.play()
    },
    step: () => {
      if (speedMps <= 0) return
      if (travelRef.current.phase >= 1) moveTo({ phase: 0, offset: createRestOffset() })
      clock.step()
      setSteppedInMotion(travelRef.current.phase < 1)
    },
    steppedInMotion,
    reset,
    phase,
    motionOffset,
    signedVoltageV: readings.signedVoltageV,
    voltageMagnitudeV: readings.voltageMagnitudeV,
    effectiveCuttingRatio: readings.effectiveCuttingRatio,
    angleBetweenBLDeg: readings.angleBetweenBLDeg,
    angleBetweenLVDeg: readings.angleBetweenLVDeg,
    angleBetweenBVDeg: readings.angleBetweenBVDeg,
    angleBetweenBLLabel: formatAngleLabel(readings.angleBetweenBLDeg),
    angleBetweenLVLabel: formatAngleLabel(readings.angleBetweenLVDeg),
    angleBetweenBVLabel: formatAngleLabel(readings.angleBetweenBVDeg),
    needleAngleRad: -clamp(readings.signedVoltageV / MAX_DISPLAY_VOLTAGE, -1, 1) * (Math.PI / 3),
    polarityText: formatPolarityText(readings.signedVoltageV),
    relationText: formatRelationText(readings),
  }
}
