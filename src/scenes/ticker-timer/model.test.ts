import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PERIOD_S,
  FRICTION_FORCE_N,
  FIXED_STEP_S,
  MAX_DOTS,
  createTickerTimerState,
  deriveTapeSpeedSeries,
  deriveEffectiveAccelerationMps2,
  derivePeriodS,
  derivePrintQuality,
  deriveTapeAnalysis,
  deriveTapeDots,
  displacementAtTimeS,
  punchPhase01,
  releaseTape,
  stepTickerTimerState,
  togglePowered,
} from './model'

describe('ticker timer model', () => {
  it('uses the classroom 50 Hz / 0.02 s period and 5-interval 0.10 s counting time', () => {
    expect(derivePeriodS(50)).toBeCloseTo(DEFAULT_PERIOD_S, 8)
    expect(5 * derivePeriodS(50)).toBeCloseTo(0.1, 8)
  })

  it('gives electromagnetic timers more tape drag than spark timers', () => {
    expect(FRICTION_FORCE_N.electromagnetic).toBeGreaterThan(FRICTION_FORCE_N.spark)
    const em = deriveEffectiveAccelerationMps2({
      kind: 'electromagnetic',
      motionMode: 'accelerate',
      frequencyHz: 50,
      voltageV: 6,
      initialSpeedMps: 0,
      driveAccelerationMps2: 2,
      massKg: 0.2,
    })
    const spark = deriveEffectiveAccelerationMps2({
      kind: 'spark',
      motionMode: 'accelerate',
      frequencyHz: 50,
      voltageV: 220,
      initialSpeedMps: 0,
      driveAccelerationMps2: 2,
      massKg: 0.2,
    })
    expect(spark).toBeGreaterThan(em)
    expect(em).toBeCloseTo(2 - 0.0294 / 0.2, 5)
  })

  it('prints equally spaced dots for uniform motion at v Δt', () => {
    let state = createTickerTimerState({
      motionMode: 'uniform',
      initialSpeedMps: 0.5,
      frequencyHz: 50,
    })
    state = togglePowered(state)
    state = releaseTape(state)
    state = { ...state, elapsedTimeS: 0.2 }

    const dots = deriveTapeDots(state)
    expect(dots.length).toBeGreaterThan(8)
    const interval = dots[4].positionM - dots[3].positionM
    expect(interval).toBeCloseTo(0.5 * 0.02, 6)
    expect(dots[1].positionM - dots[0].positionM).toBeCloseTo(interval, 6)
  })

  it('plots finite-difference speeds at the true interval midpoint when dots are missed', () => {
    const period = 0.02
    const acceleration = 2
    const initialSpeed = 0.4
    const times = [0, period, period * 3, period * 4]
    const dots = times.map((timeS, index) => ({
      index: [0, 1, 3, 4][index],
      timeS,
      positionM: initialSpeed * timeS + 0.5 * acceleration * timeS * timeS,
      smeared: false,
    }))

    const samples = deriveTapeSpeedSeries(dots, period)

    expect(samples[0].timeS).toBeCloseTo(0.03, 8)
    expect(samples[0].speedMps).toBeCloseTo(0.46, 8)
    expect(samples[1].timeS).toBeCloseTo(0.05, 8)
    expect(samples[1].speedMps).toBeCloseTo(0.5, 8)
  })

  it('stops a stationary run when the recording period limit is reached', () => {
    let state = togglePowered(createTickerTimerState({ motionMode: 'rest', frequencyHz: 50 }))
    state = releaseTape(state)
    state = stepTickerTimerState(state, (MAX_DOTS - 1) * DEFAULT_PERIOD_S)

    expect(state.finished).toBe(true)
    expect(deriveTapeDots(state)).toHaveLength(MAX_DOTS)
    expect(state.powered).toBe(true)
    expect(togglePowered(state).powered).toBe(false)
    const poweredOff = togglePowered(state)
    expect(togglePowered(poweredOff)).toEqual(poweredOff)
  })

  it('ignores the stacked start cluster when measuring acceleration after a delayed release', () => {
    let state = createTickerTimerState({
      kind: 'spark',
      motionMode: 'accelerate',
      driveAccelerationMps2: 2,
      massKg: 0.2,
      frequencyHz: 50,
      voltageV: 220,
    })
    state = togglePowered(state)
    state = { ...state, elapsedTimeS: 0.08 }
    state = releaseTape(state)
    state = { ...state, elapsedTimeS: 0.36 }
    const analysis = deriveTapeAnalysis(state)
    expect(analysis.measuredAccelerationMps2 ?? 0).toBeCloseTo(analysis.effectiveAccelerationMps2, 2)
  })

  it('spreads dots under constant acceleration and recovers a by successive differences', () => {
    let state = createTickerTimerState({
      kind: 'spark',
      motionMode: 'accelerate',
      driveAccelerationMps2: 2,
      massKg: 0.2,
      frequencyHz: 50,
      voltageV: 220,
    })
    state = togglePowered(state)
    state = releaseTape(state)
    state = { ...state, elapsedTimeS: 0.28 }

    const analysis = deriveTapeAnalysis(state)
    expect(analysis.dotCount).toBeGreaterThan(10)
    expect(analysis.latestIntervalM ?? 0).toBeGreaterThan(0.01)
    expect(analysis.measuredAccelerationMps2).not.toBeNull()
    expect(analysis.measuredAccelerationMps2 ?? 0).toBeCloseTo(analysis.effectiveAccelerationMps2, 2)
  })

  it('stacks overlapping dots when powered before the tape is released', () => {
    let state = createTickerTimerState({ motionMode: 'accelerate' })
    state = togglePowered(state)
    state = { ...state, elapsedTimeS: 0.08 }
    const dots = deriveTapeDots(state)
    expect(dots.length).toBeGreaterThan(2)
    expect(dots.every((dot) => dot.positionM === 0)).toBe(true)
  })

  it('rejects release while unpowered and keeps the state frozen', () => {
    let state = createTickerTimerState({
      motionMode: 'uniform',
      initialSpeedMps: 0.4,
    })
    const released = releaseTape(state)
    expect(released).toEqual(state)
    state = stepTickerTimerState(released, 0.2)
    expect(deriveTapeDots(state)).toEqual([])
    expect(state.elapsedTimeS).toBe(0)
    expect(displacementAtTimeS(state, 0.2)).toBe(0)
  })

  it('produces a readable full run with at least 50 dots at 50 Hz', () => {
    let state = togglePowered(createTickerTimerState())
    state = releaseTape(state)
    for (let index = 0; index < 1000 && !state.finished; index += 1) {
      state = stepTickerTimerState(state, FIXED_STEP_S)
    }
    const analysis = deriveTapeAnalysis(state)
    expect(state.finished).toBe(true)
    expect(analysis.dotCount).toBeGreaterThanOrEqual(50)
    expect(analysis.dotCount).toBeLessThanOrEqual(MAX_DOTS)
  })

  it('retains the last dot snapshot and chart series after power off', () => {
    let state = togglePowered(createTickerTimerState())
    state = releaseTape(state)
    for (let index = 0; index < 140; index += 1) {
      state = stepTickerTimerState(state, FIXED_STEP_S)
    }
    const poweredAnalysis = deriveTapeAnalysis(state)
    const stopped = togglePowered(state)
    const stoppedAnalysis = deriveTapeAnalysis(stopped)
    expect(stoppedAnalysis.dots).toEqual(poweredAnalysis.dots)
    expect(stoppedAnalysis.speedSeriesMps).toEqual(poweredAnalysis.speedSeriesMps)
    expect(stepTickerTimerState(stopped, 1)).toEqual(stopped)
  })

  it('uses the same non-zero terminal speed for telemetry and the chart', () => {
    let state = togglePowered(createTickerTimerState())
    state = releaseTape(state)
    for (let index = 0; index < 1000 && !state.finished; index += 1) {
      state = stepTickerTimerState(state, FIXED_STEP_S)
    }
    const analysis = deriveTapeAnalysis(state)
    const chartSpeed = analysis.speedSeriesMps[analysis.speedSeriesMps.length - 1].speedMps
    expect(chartSpeed).toBeGreaterThan(0)
    expect(analysis.instantaneousSpeedMps).toBeCloseTo(chartSpeed, 8)
  })

  it('marks low EM voltage as missed dots and high voltage as smeared traces', () => {
    expect(derivePrintQuality('electromagnetic', 3.5)).toBe('missed')
    expect(derivePrintQuality('electromagnetic', 6)).toBe('clear')
    expect(derivePrintQuality('electromagnetic', 8)).toBe('smeared')
    expect(derivePrintQuality('spark', 220)).toBe('clear')
  })

  it('advances elapsed time on each fixed step while powered', () => {
    let state = togglePowered(createTickerTimerState())
    state = stepTickerTimerState(state, 0.01)
    expect(state.elapsedTimeS).toBeCloseTo(0.01, 8)
    expect(punchPhase01(0.01, 50)).toBeCloseTo(0.5, 5)
  })
})
