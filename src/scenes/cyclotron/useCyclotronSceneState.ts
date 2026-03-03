import { useEffect, useMemo, useState } from 'react'
import { deriveGapWidthScene, projectParticleToScene, TRAJECTORY_Y, type Point3 } from './layout'
import { deriveCyclotronLaunchState, deriveCyclotronReadings } from './model'
import {
  buildTimeSeries,
  deriveAdaptiveWindowS,
  evaluateGapVoltageAtTime,
  evaluateKineticEnergyAtTime,
  type CyclotronEnergyMode,
  type TimeSample,
} from './trace'
import { appendTrailPoint } from './trail'
import {
  CYCLOTRON_DEFAULT_INITIAL_SPEED_MPS,
  useCyclotronSimulation,
} from './useCyclotronSimulation'

const SIMULATION_DT_S = 1e-10
const MAX_TRAIL_POINTS = 900

export type CyclotronSceneState = {
  magneticFieldT: number
  setMagneticFieldT: (value: number) => void
  electricFieldVPerM: number
  setElectricFieldVPerM: (value: number) => void
  gapHalfWidthMm: number
  setGapHalfWidthMm: (value: number) => void
  energyMode: CyclotronEnergyMode
  setEnergyMode: (value: CyclotronEnergyMode) => void
  simulation: ReturnType<typeof useCyclotronSimulation>
  reset: () => void
  launchPositionY: number
  voltageDirectionText: string
  currentVoltageV: number
  currentEnergyJ: number
  cyclotronPeriodS: number
  voltageSeries: TimeSample[]
  energySeries: TimeSample[]
  voltageRange: [number, number]
  particlePoint: Point3
  trailPoints: Point3[]
  voltagePhase: number
  particleInGap: boolean
  deeGapWidth: number
}

export function useCyclotronSceneState(): CyclotronSceneState {
  const [magneticFieldT, setMagneticFieldT] = useState(2.0)
  const [electricFieldVPerM, setElectricFieldVPerM] = useState(3e4)
  const [gapHalfWidthMm, setGapHalfWidthMm] = useState(0.06)
  const [energyMode, setEnergyMode] = useState<CyclotronEnergyMode>('include-acceleration-time')
  const [simulationTimeS, setSimulationTimeS] = useState(0)
  const [trailPoints, setTrailPoints] = useState<Point3[]>([[0, TRAJECTORY_Y, 0]])

  const config = useMemo(
    () => ({
      chargeC: 1.6e-19,
      massKg: 1.67e-27,
      magneticFieldT,
      electricFieldVPerM,
      gapHalfWidthM: gapHalfWidthMm / 1000,
    }),
    [electricFieldVPerM, gapHalfWidthMm, magneticFieldT],
  )

  const launchState = useMemo(
    () => deriveCyclotronLaunchState(config, CYCLOTRON_DEFAULT_INITIAL_SPEED_MPS),
    [config],
  )

  const deeGapWidth = useMemo(() => deriveGapWidthScene(config.gapHalfWidthM), [config.gapHalfWidthM])

  const launchPoint = useMemo(() => projectParticleToScene(launchState.position), [launchState.position])

  const simulation = useCyclotronSimulation(config, SIMULATION_DT_S, launchState)
  const readings = deriveCyclotronReadings(simulation.state, config)
  const gapWidthM = config.gapHalfWidthM * 2
  const cyclotronPeriodS =
    Number.isFinite(readings.periodS) && readings.periodS > 0 ? readings.periodS : 1e-8
  const adaptiveWindowS = deriveAdaptiveWindowS(cyclotronPeriodS)
  const voltageAmplitudeV = electricFieldVPerM * gapWidthM

  const particlePoint = useMemo(
    () => projectParticleToScene(simulation.state.position),
    [simulation.state.position],
  )

  const currentVoltageV = evaluateGapVoltageAtTime(simulationTimeS, voltageAmplitudeV, cyclotronPeriodS)
  const voltageDirectionText = currentVoltageV >= 0 ? 'D1 → D2' : 'D2 → D1'
  const voltagePhase = ((simulationTimeS % cyclotronPeriodS) + cyclotronPeriodS) / cyclotronPeriodS % 1
  const particleInGap = Math.abs(simulation.state.position.x) <= config.gapHalfWidthM

  const initialEnergyJ = useMemo(
    () => 0.5 * config.massKg * CYCLOTRON_DEFAULT_INITIAL_SPEED_MPS * CYCLOTRON_DEFAULT_INITIAL_SPEED_MPS,
    [config.massKg],
  )
  const deltaEnergyJ = Math.abs(config.chargeC * voltageAmplitudeV)
  const crossingDurationS = gapWidthM / Math.max(1, readings.speed)

  const currentEnergyJ = evaluateKineticEnergyAtTime({
    mode: energyMode,
    timeS: simulationTimeS,
    periodS: cyclotronPeriodS,
    initialEnergyJ,
    deltaEnergyJ,
    crossingDurationS,
  })

  const voltageSeries = buildTimeSeries({
    endTimeS: simulationTimeS,
    windowS: adaptiveWindowS,
    samples: 260,
    evaluate: (timeS) => evaluateGapVoltageAtTime(timeS, voltageAmplitudeV, cyclotronPeriodS),
  })

  const energySeries = buildTimeSeries({
    endTimeS: simulationTimeS,
    windowS: adaptiveWindowS,
    samples: 260,
    evaluate: (timeS) =>
      evaluateKineticEnergyAtTime({
        mode: energyMode,
        timeS,
        periodS: cyclotronPeriodS,
        initialEnergyJ,
        deltaEnergyJ,
        crossingDurationS,
      }),
  })

  const voltageRange = useMemo<[number, number]>(() => {
    const bound = Math.max(1, Math.abs(voltageAmplitudeV) * 1.1)
    return [-bound, bound]
  }, [voltageAmplitudeV])

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setSimulationTimeS(0)
      setTrailPoints([launchPoint])
    })
    return () => cancelAnimationFrame(frameId)
  }, [launchPoint])

  useEffect(() => {
    if (!simulation.running) {
      return
    }

    const frameId = requestAnimationFrame(() => {
      setSimulationTimeS((value) => value + SIMULATION_DT_S)
    })
    return () => cancelAnimationFrame(frameId)
  }, [simulation.running, simulation.state.position, simulation.state.velocity])

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setTrailPoints((previous) => appendTrailPoint(previous, particlePoint, MAX_TRAIL_POINTS))
    })
    return () => cancelAnimationFrame(frameId)
  }, [particlePoint])

  const reset = () => {
    simulation.reset()
    setSimulationTimeS(0)
    setTrailPoints([launchPoint])
  }

  return {
    magneticFieldT,
    setMagneticFieldT,
    electricFieldVPerM,
    setElectricFieldVPerM,
    gapHalfWidthMm,
    setGapHalfWidthMm,
    energyMode,
    setEnergyMode,
    simulation,
    reset,
    launchPositionY: launchState.position.y,
    voltageDirectionText,
    currentVoltageV,
    currentEnergyJ,
    cyclotronPeriodS,
    voltageSeries,
    energySeries,
    voltageRange,
    particlePoint,
    trailPoints,
    voltagePhase,
    particleInGap,
    deeGapWidth,
  }
}
