import { useEffect, useMemo, useRef, useState } from 'react'
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

export function useMotionalEmfSceneState(): MotionalEmfSceneState {
  const [magneticFieldT, setMagneticFieldT] = useState(DEFAULT_MAGNETIC_FIELD_T)
  const [magneticFieldDirection, setMagneticFieldDirection] = useState<MagneticFieldDirection>(DEFAULT_MAGNETIC_FIELD_DIRECTION)
  const [rodLengthM, setRodLengthM] = useState(DEFAULT_ROD_LENGTH_M)
  const [speedMps, setSpeedMps] = useState(DEFAULT_SPEED_MPS)
  const [rodAngleDeg, setRodAngleDeg] = useState(DEFAULT_ROD_ANGLE_DEG)
  const [discussionMode, setDiscussionMode] = useState<DiscussionMode>(DEFAULT_DISCUSSION_MODE)
  const [velocityPreset, setVelocityPreset] = useState<VelocityPreset>(DEFAULT_VELOCITY_PRESET)
  const [rodVelocityAngleDeg, setRodVelocityAngleDeg] = useState<RodVelocityAnglePreset>(DEFAULT_ROD_VELOCITY_ANGLE_DEG)
  const [motionDirection, setMotionDirection] = useState<MotionDirectionPreset>(DEFAULT_MOTION_DIRECTION)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState(0)
  const [motionOffset, setMotionOffset] = useState<MotionOffset>(createRestOffset)
  const phaseRef = useRef(0)
  const motionOffsetRef = useRef<MotionOffset>(createRestOffset())

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    motionOffsetRef.current = motionOffset
  }, [motionOffset])

  useEffect(() => {
    if (!running) {
      return
    }

    let frameId = 0
    let previous = performance.now()

    const frame = (now: number) => {
      const deltaS = Math.min(0.05, (now - previous) / 1000)
      previous = now

      const previousPhase = phaseRef.current
      const nextPhase = advanceTravelProgress({
        previous: previousPhase,
        deltaS,
        speedMps,
        travelSpan: MOTIONAL_EMF_LAYOUT.motion.travelDistance,
      })
      const distanceDelta = (nextPhase - previousPhase) * MOTIONAL_EMF_LAYOUT.motion.travelDistance

      if (distanceDelta > 0) {
        const nextOffset = advanceMotionOffset({
          previous: motionOffsetRef.current,
          deltaS: 1,
          speedMps: distanceDelta,
          discussionMode,
          velocityPreset,
          magneticFieldDirection,
          rodAngleDeg,
          rodVelocityAngleDeg,
          motionDirection,
        })
        motionOffsetRef.current = nextOffset
        setMotionOffset(nextOffset)
      }

      phaseRef.current = nextPhase
      setPhase(nextPhase)

      if (nextPhase >= 1 || speedMps <= 0) {
        setRunning(false)
        return
      }

      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [discussionMode, magneticFieldDirection, motionDirection, rodAngleDeg, rodVelocityAngleDeg, running, speedMps, velocityPreset])

  const activeMotionSpeedMps = running && phase < 1 ? speedMps : 0

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
    const restOffset = createRestOffset()
    setRunning(false)
    phaseRef.current = 0
    motionOffsetRef.current = restOffset
    setPhase(0)
    setMotionOffset(restOffset)
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
      if (running) {
        setRunning(false)
        return
      }

      if (phaseRef.current >= 1) {
        const restOffset = createRestOffset()
        phaseRef.current = 0
        motionOffsetRef.current = restOffset
        setPhase(0)
        setMotionOffset(restOffset)
      }

      if (speedMps <= 0) {
        return
      }

      setRunning(true)
    },
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
