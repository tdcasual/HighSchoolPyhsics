import { describe, expect, it } from 'vitest'
import {
  MAX_CHART_POINTS,
  MAX_METER_NEEDLE_RAD,
  METER_FULL_SCALE_A,
  createAlternatorState,
  deriveAlternatorReadings,
  stepAlternatorState,
} from './model'

describe('alternator model', () => {
  it('derives sinusoidal emf from rotating-coil angle and speed', () => {
    const zeroCrossing = deriveAlternatorReadings({
      magneticFieldT: 0.5,
      angularSpeedRad: Math.PI * 2,
      turnCount: 10,
      coilAreaM2: 0.2,
      loadResistanceOhm: 5,
      angleRad: 0,
    })
    const quarterTurn = deriveAlternatorReadings({
      magneticFieldT: 0.5,
      angularSpeedRad: Math.PI * 2,
      turnCount: 10,
      coilAreaM2: 0.2,
      loadResistanceOhm: 5,
      angleRad: Math.PI / 2,
    })

    expect(zeroCrossing.fluxWb).toBeCloseTo(0.1)
    expect(zeroCrossing.instantaneousVoltageV).toBeCloseTo(0)
    expect(quarterTurn.peakVoltageV).toBeCloseTo(Math.PI * 2)
    expect(quarterTurn.instantaneousVoltageV).toBeCloseTo(quarterTurn.peakVoltageV)
    expect(quarterTurn.frequencyHz).toBeCloseTo(1)
  })

  it('reverses current and meter deflection after half a turn', () => {
    const positive = deriveAlternatorReadings({
      magneticFieldT: 0.8,
      angularSpeedRad: 4,
      turnCount: 20,
      coilAreaM2: 0.16,
      loadResistanceOhm: 8,
      angleRad: Math.PI / 2,
    })
    const negative = deriveAlternatorReadings({
      magneticFieldT: 0.8,
      angularSpeedRad: 4,
      turnCount: 20,
      coilAreaM2: 0.16,
      loadResistanceOhm: 8,
      angleRad: Math.PI * 1.5,
    })

    expect(positive.instantaneousCurrentA).toBeGreaterThan(0)
    expect(negative.instantaneousCurrentA).toBeLessThan(0)
    expect(positive.currentDirectionLabel).toBe('A → B')
    expect(negative.currentDirectionLabel).toBe('B → A')
    expect(positive.meterNeedleAngleRad).toBeGreaterThan(0)
    expect(negative.meterNeedleAngleRad).toBeLessThan(0)
  })

  it('limits the physical meter needle to its declared ±2 A scale', () => {
    const overloaded = deriveAlternatorReadings({
      magneticFieldT: 1.8,
      angularSpeedRad: 12,
      turnCount: 32,
      coilAreaM2: 0.36,
      loadResistanceOhm: 8,
      angleRad: Math.PI / 2,
    })

    expect(METER_FULL_SCALE_A).toBe(2)
    expect(Math.abs(overloaded.instantaneousCurrentA)).toBeGreaterThan(METER_FULL_SCALE_A)
    expect(overloaded.meterNeedleAngleRad).toBe(MAX_METER_NEEDLE_RAD)
  })

  it('samples and trims waveform history while running', () => {
    let state = createAlternatorState({ isRunning: true, angularSpeedRad: Math.PI * 2 })

    for (let index = 0; index < 1200; index += 1) {
      state = stepAlternatorState(state)
    }

    expect(state.history.voltage.length).toBe(MAX_CHART_POINTS)
    expect(state.history.current.length).toBe(MAX_CHART_POINTS)
    expect(state.angleRad).toBeGreaterThan(0)
    expect(state.elapsedTimeS).toBeGreaterThan(10)
  })
})
