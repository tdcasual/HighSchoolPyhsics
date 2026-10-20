import { recall, useRemember } from '../../app/sceneMemory/sceneMemory'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSimulationClock } from '../../simulation/useSimulationClock'
import {
  deriveGapWidthScene,
  MAX_ORBIT_RADIUS_M,
  projectParticleToScene,
  type Point3,
} from './layout'
import { deriveCyclotronLaunchState, deriveCyclotronMaximumKineticEnergyJ, type CyclotronConfig } from './model'
import { advanceCyclotronRun, cyclotronPeriodS, kineticEnergyJ, type CyclotronRun } from './run'
import {
  buildTimeSeries,
  deriveAdaptiveWindowS,
  evaluateGapVoltageAtTime,
  evaluateKineticEnergyAtTime,
  type CyclotronEnergyMode,
  type TimeSample,
} from './trace'
import { appendTrailPoint } from './trail'

const PROTON = { chargeC: 1.6e-19, massKg: 1.67e-27 }
/** Ion-source injection speed (~50 eV): the first orbit is about a millimetre across. */
const LAUNCH_SPEED_MPS = 1e5
/** Animation pace at 1×: cyclotron turns shown per real second. */
const TURNS_PER_SECOND = 2
const MAX_TRAIL_POINTS = 6000
const MAX_HISTORY_SAMPLES = 2400

export type CyclotronSceneState = {
  magneticFieldT: number
  setMagneticFieldT: (value: number) => void
  /** Peak RF voltage across the gap, in kV. */
  gapVoltageKv: number
  setGapVoltageKv: (value: number) => void
  /** Gap width between the D-boxes, in cm. */
  gapWidthCm: number
  setGapWidthCm: (value: number) => void
  energyMode: CyclotronEnergyMode
  setEnergyMode: (value: CyclotronEnergyMode) => void
  running: boolean
  toggleRunning: () => void
  /** Pause and advance half a turn: one pass through a D-box and one gap crossing. */
  step: () => void
  reset: () => void
  timeS: number
  crossings: number
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

type RunView = {
  run: CyclotronRun
  crossings: number
  trail: Point3[]
  history: TimeSample[]
}

function startRun(config: CyclotronConfig): RunView {
  const particle = deriveCyclotronLaunchState(config, LAUNCH_SPEED_MPS)
  return {
    run: { particle, timeS: 0, extracted: false },
    crossings: 0,
    trail: [projectParticleToScene(particle.position)],
    history: [{ timeS: 0, value: kineticEnergyJ(particle, config.massKg) }],
  }
}

/** Advance the run, collecting trail points, the energy history and gap crossings on the way. */
function advanceView(view: RunView, config: CyclotronConfig, simSeconds: number): RunView {
  let { trail, crossings } = view
  const history = [...view.history]
  let side = Math.sign(view.run.particle.position.y) || 1
  const run = advanceCyclotronRun(view.run, config, simSeconds, MAX_ORBIT_RADIUS_M, ({ particle, timeS }) => {
    trail = appendTrailPoint(trail, projectParticleToScene(particle.position), MAX_TRAIL_POINTS)
    history.push({ timeS, value: kineticEnergyJ(particle, config.massKg) })
    const nextSide = Math.sign(particle.position.y)
    if (nextSide !== 0 && nextSide !== side) {
      crossings++
      side = nextSide
    }
  })
  return { run, crossings, trail, history: history.slice(-MAX_HISTORY_SAMPLES) }
}

export function useCyclotronSceneState(): CyclotronSceneState {
  const [magneticFieldT, setMagneticFieldT] = useState(() => recall('cyclotron.magneticFieldT', 1.0))
  const [gapVoltageKv, setGapVoltageKv] = useState(() => recall('cyclotron.gapVoltageKv', 150))
  const [gapWidthCm, setGapWidthCm] = useState(() => recall('cyclotron.gapWidthCm', 2))
  const [energyMode, setEnergyMode] = useState<CyclotronEnergyMode>(() => recall('cyclotron.energyMode', 'include-acceleration-time'))
  useRemember('cyclotron', { magneticFieldT, gapVoltageKv, gapWidthCm, energyMode })

  const config = useMemo<CyclotronConfig>(
    () => ({
      ...PROTON,
      magneticFieldT,
      electricFieldVPerM: (gapVoltageKv * 1000) / (gapWidthCm / 100),
      gapHalfWidthM: gapWidthCm / 200,
    }),
    [gapVoltageKv, gapWidthCm, magneticFieldT],
  )
  const periodS = cyclotronPeriodS(config)

  const [view, setView] = useState<RunView>(() => startRun(config))
  const viewRef = useRef(view)
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
    viewRef.current = view
  })
  const show = (next: RunView) => {
    viewRef.current = next
    setView(next)
  }
  // Shown at TURNS_PER_SECOND turns per real second; 单步 = half a turn (one gap crossing).
  const clock = useSimulationClock({
    timeScale: TURNS_PER_SECOND * periodS,
    stepSeconds: periodS / 2,
    advance: (dt) => {
      if (viewRef.current.run.extracted) return false
      const next = advanceView(viewRef.current, configRef.current, dt)
      show(next)
      return !next.run.extracted
    },
  })

  // A new machine set-up restarts the run from the ion source (adjusting state during render).
  const [configKey, setConfigKey] = useState(config)
  if (configKey !== config) {
    setConfigKey(config)
    setView(startRun(config))
    clock.pause()
  }

  const { run } = view
  const voltageAmplitudeV = gapVoltageKv * 1000
  const currentVoltageV = evaluateGapVoltageAtTime(run.timeS, voltageAmplitudeV, periodS)
  const currentEnergyJ = kineticEnergyJ(run.particle, config.massKg)
  const maximumKineticEnergyJ = deriveCyclotronMaximumKineticEnergyJ(config, MAX_ORBIT_RADIUS_M)
  const windowS = deriveAdaptiveWindowS(periodS)
  const initialEnergyJ = view.history[0]?.value ?? 0

  const voltageSeries = buildTimeSeries({
    endTimeS: run.timeS,
    windowS,
    samples: 260,
    evaluate: (timeS) => evaluateGapVoltageAtTime(timeS, voltageAmplitudeV, periodS),
  })
  // 考虑加速时间: the simulated energy, which rises during each finite gap transit.
  // 忽略加速时间: the ideal staircase, +qU at every half period.
  const windowStart = Math.max(0, run.timeS - windowS)
  const energySeries = energyMode === 'include-acceleration-time'
    ? view.history.filter((sample) => sample.timeS >= windowStart)
    : buildTimeSeries({
        endTimeS: run.timeS,
        windowS,
        samples: 260,
        evaluate: (timeS) =>
          Math.min(maximumKineticEnergyJ, evaluateKineticEnergyAtTime({
            mode: 'ignore-acceleration-time',
            timeS,
            periodS,
            initialEnergyJ,
            deltaEnergyJ: Math.abs(config.chargeC) * voltageAmplitudeV,
            crossingDurationS: 0,
          })),
      })

  return {
    magneticFieldT,
    setMagneticFieldT,
    gapVoltageKv,
    setGapVoltageKv,
    gapWidthCm,
    setGapWidthCm,
    energyMode,
    setEnergyMode,
    running: clock.running,
    toggleRunning: () => {
      if (!viewRef.current.run.extracted) clock.toggle()
    },
    step: clock.step,
    reset: () => {
      clock.pause()
      show(startRun(config))
    },
    timeS: run.timeS,
    crossings: view.crossings,
    voltageDirectionText: currentVoltageV >= 0 ? 'D1 → D2' : 'D2 → D1',
    currentVoltageV,
    currentEnergyJ,
    maximumKineticEnergyJ,
    cyclotronPeriodS: periodS,
    voltageSeries,
    energySeries,
    voltageRange: [-voltageAmplitudeV * 1.1, voltageAmplitudeV * 1.1],
    particlePoint: projectParticleToScene(run.particle.position),
    trailPoints: view.trail,
    voltagePhase: (((run.timeS % periodS) + periodS) % periodS) / periodS,
    particleInGap: Math.abs(run.particle.position.x) <= config.gapHalfWidthM,
    particleReachedRim: run.extracted,
    deeGapWidth: deriveGapWidthScene(config.gapHalfWidthM),
  }
}
