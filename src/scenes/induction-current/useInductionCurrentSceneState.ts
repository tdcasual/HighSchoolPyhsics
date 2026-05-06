import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createExperimentRecord,
  type ExperimentRecord,
  type InductionOutcome,
  type MotionDirection,
  type PoleSetting,
} from './model'

const FAR_POSITION_Y = 15
const NEAR_POSITION_Y = 0
const MOTION_DURATION_MS = 420
const MOVEMENT_SPEED = 0.15

type MagnetPosition = 'far' | 'near'

function easeInOut(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - ((-2 * value + 2) ** 3) / 2
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function resolveMagnetY(
  position: MagnetPosition,
  motionDirection: MotionDirection | null,
  motionProgress: number,
): number {
  if (!motionDirection) {
    return position === 'far' ? FAR_POSITION_Y : NEAR_POSITION_Y
  }

  const eased = easeInOut(motionProgress)
  if (motionDirection === 'approach') {
    return FAR_POSITION_Y + (NEAR_POSITION_Y - FAR_POSITION_Y) * eased
  }
  return NEAR_POSITION_Y + (FAR_POSITION_Y - NEAR_POSITION_Y) * eased
}

export type InductionCurrentSceneState = {
  poleSetting: PoleSetting
  magnetPosition: MagnetPosition
  magnetY: number
  isMoving: boolean
  motionDirection: MotionDirection | null
  lastMotionDirection: MotionDirection | null
  motionProgress: number
  coilCurrent: number
  coilCurrentSign: -1 | 0 | 1
  needleAngleRad: number
  records: ExperimentRecord[]
  lastOutcome: InductionOutcome | null
  showConclusion: boolean
  canChangePolarity: boolean
  canMoveTowardsCoil: boolean
  canMoveAwayFromCoil: boolean
  setPoleSetting: (value: PoleSetting) => void
  moveTowardsCoil: () => void
  moveAwayFromCoil: () => void
  resetExperiment: () => void
  toggleConclusion: () => void
}

export function useInductionCurrentSceneState(): InductionCurrentSceneState {
  const recordIdRef = useRef(1)
  const pendingRecordRef = useRef<ExperimentRecord | null>(null)
  const [poleSetting, setPoleSettingState] = useState<PoleSetting>('s-top-n-down')
  const [magnetPosition, setMagnetPosition] = useState<MagnetPosition>('far')
  const [motionDirection, setMotionDirection] = useState<MotionDirection | null>(null)
  const [lastMotionDirection, setLastMotionDirection] = useState<MotionDirection | null>(null)
  const [motionProgress, setMotionProgress] = useState(0)
  const [coilCurrent, setCoilCurrent] = useState(0)
  const [records, setRecords] = useState<ExperimentRecord[]>([])
  const [lastOutcome, setLastOutcome] = useState<InductionOutcome | null>(null)
  const [showConclusion, setShowConclusion] = useState(false)

  useEffect(() => {
    if (!motionDirection) {
      return
    }

    const startedAt = performance.now()
    let frameId = 0

    const frame = () => {
      const elapsedMs = performance.now() - startedAt
      const nextProgress = Math.min(1, elapsedMs / MOTION_DURATION_MS)
      setMotionProgress(nextProgress)

      const nextY = resolveMagnetY(magnetPosition, motionDirection, nextProgress)
      const velocity = motionDirection === 'approach' ? -MOVEMENT_SPEED : MOVEMENT_SPEED
      const intensity = 15 / (nextY * nextY + 10)
      let current = -velocity * intensity * 5
      if (poleSetting === 's-bottom-n-up') {
        current = -current
      }
      setCoilCurrent(current)

      if (nextProgress >= 1) {
        const completedRecord = pendingRecordRef.current
        if (completedRecord) {
          setRecords((previous) => [...previous, completedRecord])
          setLastOutcome(completedRecord)
          pendingRecordRef.current = null
        }
        setMotionDirection(null)
        setMotionProgress(0)
        setCoilCurrent(0)
        return
      }

      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [magnetPosition, motionDirection, poleSetting])

  const magnetY = useMemo(
    () => resolveMagnetY(magnetPosition, motionDirection, motionProgress),
    [magnetPosition, motionDirection, motionProgress],
  )

  const canMoveTowardsCoil = magnetPosition === 'far' && motionDirection === null
  const canMoveAwayFromCoil = magnetPosition === 'near' && motionDirection === null
  const canChangePolarity = motionDirection === null
  const coilCurrentSign = coilCurrent > 0 ? 1 : coilCurrent < 0 ? -1 : 0
  const needleAngleRad = -clamp(coilCurrent * 1.5, -Math.PI / 4, Math.PI / 4)

  const runMotion = (direction: MotionDirection) => {
    if (motionDirection) {
      return
    }
    if (direction === 'approach' && magnetPosition !== 'far') {
      return
    }
    if (direction === 'recede' && magnetPosition !== 'near') {
      return
    }

    const record = createExperimentRecord({
      id: recordIdRef.current,
      poleSetting,
      motion: direction,
    })
    recordIdRef.current += 1

    pendingRecordRef.current = record
    setMotionDirection(direction)
    setLastMotionDirection(direction)
    setMotionProgress(0)
    setMagnetPosition(direction === 'approach' ? 'near' : 'far')
  }

  const resetExperiment = () => {
    pendingRecordRef.current = null
    setMotionDirection(null)
    setLastMotionDirection(null)
    setMotionProgress(0)
    setMagnetPosition('far')
    setCoilCurrent(0)
    setRecords([])
    setLastOutcome(null)
    setShowConclusion(false)
    recordIdRef.current = 1
  }

  return {
    poleSetting,
    magnetPosition,
    magnetY,
    isMoving: motionDirection !== null,
    motionDirection,
    lastMotionDirection,
    motionProgress,
    coilCurrent,
    coilCurrentSign,
    needleAngleRad,
    records,
    lastOutcome,
    showConclusion,
    canChangePolarity,
    canMoveTowardsCoil,
    canMoveAwayFromCoil,
    setPoleSetting: (value) => {
      if (motionDirection) {
        return
      }
      setPoleSettingState(value)
    },
    moveTowardsCoil: () => runMotion('approach'),
    moveAwayFromCoil: () => runMotion('recede'),
    resetExperiment,
    toggleConclusion: () => setShowConclusion((value) => !value),
  }
}
