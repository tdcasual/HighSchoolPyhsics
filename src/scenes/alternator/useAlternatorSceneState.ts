import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FIXED_STEP_S,
  createAlternatorState,
  deriveAlternatorReadings,
  formatAngleLabel,
  formatAreaLabel,
  formatCurrentLabel,
  formatFluxLabel,
  formatFrequencyLabel,
  formatNeedleAngleLabel,
  formatSpeedLabel,
  formatTurnsLabel,
  formatVoltageLabel,
  resetAlternatorState,
  stepAlternatorState,
  type AlternatorState,
} from './model'

const FIXED_STEP_MS = FIXED_STEP_S * 1000
const MAX_ACCUMULATED_MS = FIXED_STEP_MS * 15
const STEP_EPSILON_MS = 0.001

type StateUpdater =
  | AlternatorState
  | ((previous: AlternatorState) => AlternatorState)

export type AlternatorSceneState = AlternatorState & ReturnType<typeof buildReadoutState> & {
  running: boolean
  setMagneticFieldT: (value: number) => void
  setAngularSpeedRad: (value: number) => void
  setTurnCount: (value: number) => void
  setCoilAreaM2: (value: number) => void
  toggleRunning: () => void
  reset: () => void
}

function buildReadoutState(simulation: AlternatorState) {
  const readings = deriveAlternatorReadings(simulation)

  return {
    ...readings,
    speedLabel: formatSpeedLabel(simulation.angularSpeedRad),
    angleLabel: formatAngleLabel(simulation.angleRad),
    voltageLabel: formatVoltageLabel(readings.instantaneousVoltageV),
    currentLabel: formatCurrentLabel(readings.instantaneousCurrentA),
    frequencyLabel: formatFrequencyLabel(readings.frequencyHz),
    fluxLabel: formatFluxLabel(readings.fluxWb),
    needleAngleLabel: formatNeedleAngleLabel(readings.meterNeedleAngleRad),
    turnsLabel: formatTurnsLabel(simulation.turnCount),
    areaLabel: formatAreaLabel(simulation.coilAreaM2),
    timeLabel: `${simulation.elapsedTimeS.toFixed(2)} s`,
  }
}

export function useAlternatorSceneState(): AlternatorSceneState {
  const [simulation, setSimulation] = useState(() => createAlternatorState())
  const simulationRef = useRef(simulation)
  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const accumulatedMsRef = useRef(0)

  const resetAnimationClock = useCallback(() => {
    lastTimestampRef.current = null
    accumulatedMsRef.current = 0
  }, [])

  const commitSimulation = useCallback((updater: StateUpdater) => {
    setSimulation((previous) => {
      const next = typeof updater === 'function'
        ? (updater as (prev: AlternatorState) => AlternatorState)(previous)
        : updater
      simulationRef.current = next
      return next
    })
  }, [])

  useEffect(() => {
    simulationRef.current = simulation
  }, [simulation])

  useEffect(() => {
    if (!simulation.isRunning || frameRef.current !== null) {
      return
    }

    const tick = (timestampMs: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestampMs
      } else {
        const elapsedMs = Math.max(0, timestampMs - lastTimestampRef.current)
        lastTimestampRef.current = timestampMs
        accumulatedMsRef.current = Math.min(
          accumulatedMsRef.current + elapsedMs,
          MAX_ACCUMULATED_MS,
        )

        let next = simulationRef.current
        let advanced = false

        while (accumulatedMsRef.current + STEP_EPSILON_MS >= FIXED_STEP_MS) {
          next = stepAlternatorState(next, FIXED_STEP_S)
          accumulatedMsRef.current = Math.max(0, accumulatedMsRef.current - FIXED_STEP_MS)
          advanced = true
        }

        if (advanced) {
          simulationRef.current = next
          setSimulation(next)
        }
      }

      if (simulationRef.current.isRunning) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        frameRef.current = null
        resetAnimationClock()
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      resetAnimationClock()
    }
  }, [resetAnimationClock, simulation])

  const readoutState = useMemo(() => buildReadoutState(simulation), [simulation])

  return {
    ...simulation,
    ...readoutState,
    running: simulation.isRunning,
    setMagneticFieldT: (value) => commitSimulation((previous) => ({ ...previous, magneticFieldT: value })),
    setAngularSpeedRad: (value) => commitSimulation((previous) => ({ ...previous, angularSpeedRad: value })),
    setTurnCount: (value) => commitSimulation((previous) => ({ ...previous, turnCount: Math.round(value) })),
    setCoilAreaM2: (value) => commitSimulation((previous) => ({ ...previous, coilAreaM2: value })),
    toggleRunning: () => {
      resetAnimationClock()
      commitSimulation((previous) => ({
        ...previous,
        isRunning: !previous.isRunning,
      }))
    },
    reset: () => {
      resetAnimationClock()
      commitSimulation(() => ({
        ...resetAlternatorState(),
        isRunning: false,
      }))
    },
  }
}
