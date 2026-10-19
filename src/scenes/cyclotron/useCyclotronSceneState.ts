import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  deriveGapWidthScene,
  MAX_ORBIT_RADIUS_M,
  projectParticleToScene,
  TRAJECTORY_Y,
  type Point3,
} from './layout'
import { deriveCyclotronLaunchState, deriveCyclotronMaximumKineticEnergyJ, deriveCyclotronReadings } from './model'
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
const MAX_TRAIL_POINTS = 4200

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
  maximumKineticEnergyJ: number
  cyclotronPeriodS: number
  voltageSeries: TimeSample[]
  energySeries: TimeSample[]
  voltageRange: [number, number]
  particlePoint: Point3
  trailPoints: Point3[]
  voltagePhase: number
  particleInGap: boolean
  particleReachedRim: boolean
  deeGapWidth: number
}

export function useCyclotronSceneState(): CyclotronSceneState {
  const [magneticFieldT, setMagneticFieldT] = useState(() => recall('cyclotron.magneticFieldT', 2.0))
  const [electricFieldVPerM, setElectricFieldVPerM] = useState(() => recall('cyclotron.electricFieldVPerM', 9e4))
  const [gapHalfWidthMm, setGapHalfWidthMm] = useState(() => recall('cyclotron.gapHalfWidthMm', 0.02))
  const [energyMode, setEnergyMode] = useState<CyclotronEnergyMode>(() => recall('cyclotron.energyMode', 'include-acceleration-time'))
  useRemember('cyclotron', { magneticFieldT, electricFieldVPerM, gapHalfWidthMm, energyMode })
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
  const maximumKineticEnergyJ = deriveCyclotronMaximumKineticEnergyJ(config, MAX_ORBIT_RADIUS_M)
  const simulationTimeS = simulation.elapsedTimeS
  const gapWidthM = config.gapHalfWidthM * 2
  const cyclotronPeriodS =
    Number.isFinite(readings.periodS) && readings.periodS > 0 ? readings.periodS : 1e-8
  const adaptiveWindowS = deriveAdaptiveWindowS(cyclotronPeriodS)
  const voltageAmplitudeV = electricFieldVPerM * gapWidthM * (Math.sign(magneticFieldT) || 1)

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

  const currentEnergyJ = readings.kineticEnergyJ

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
      Math.min(maximumKineticEnergyJ, evaluateKineticEnergyAtTime({
        mode: energyMode,
        timeS,
        periodS: cyclotronPeriodS,
        initialEnergyJ,
        deltaEnergyJ,
        crossingDurationS,
      })),
  })

  const voltageRange = useMemo<[number, number]>(() => {
    const bound = Math.max(1, Math.abs(voltageAmplitudeV) * 1.1)
    return [-bound, bound]
  }, [voltageAmplitudeV])

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setTrailPoints([launchPoint]))
    return () => cancelAnimationFrame(frameId)
  }, [launchPoint])

  const particlePointRef = useRef(particlePoint)
  useEffect(() => {
    particlePointRef.current = particlePoint
  }, [particlePoint])

  useEffect(() => {
    if (!simulation.running) {
      return
    }

    let frameId = 0
    const loop = () => {
      setTrailPoints((previous) => appendTrailPoint(previous, particlePointRef.current, MAX_TRAIL_POINTS))
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [simulation.running])

  const reset = () => {
    simulation.reset()
    setTrailPoints([launchPoint])
  }

  const particleReachedRim = Math.hypot(simulation.state.position.x, simulation.state.position.y) >=
    MAX_ORBIT_RADIUS_M

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
    maximumKineticEnergyJ,
    cyclotronPeriodS,
    voltageSeries,
    energySeries,
    voltageRange,
    particlePoint,
    trailPoints,
    voltagePhase,
    particleInGap,
    particleReachedRim,
    deeGapWidth,
  }
}
