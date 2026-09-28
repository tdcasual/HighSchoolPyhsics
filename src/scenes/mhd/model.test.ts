import { describe, expect, it } from 'vitest'
import {
  deriveCarrierDeflectionAmplitudeY,
  deriveChannelVisibilityConfig,
  deriveChargeSeparation,
  deriveMhdFlowAnimationScale,
  deriveMhdReadings,
  derivePolarizationTarget,
} from './model'

describe('mhd model', () => {
  it('derives induced-field direction and loaded terminal readings consistently', () => {
    const readings = deriveMhdReadings({
      magneticFieldT: 1.5,
      plasmaVelocityMps: 2000,
      electrodeGapM: 0.4,
      conductivitySPerM: 18,
      loadResistanceOhm: 0.3,
    })

    expect(readings.inducedElectricFieldVPerM).toBeCloseTo(3000)
    expect(readings.openCircuitVoltageV).toBeCloseTo(-1200)
    expect(readings.outputVoltageV).toBeCloseTo(-623.0769, 3)
    expect(readings.internalResistanceOhm).toBeCloseTo(0.27778, 4)
    expect(readings.outputCurrentA).toBeCloseTo(2076.923, 2)
    expect(readings.currentDensityApm2).toBeCloseTo(25961.538, 2)
    expect(readings.outputPowerW).toBeCloseTo(1294083, 0)
  })

  it('ramps charge separation toward steady state after switching on', () => {
    const started = deriveChargeSeparation({
      previous: 0,
      deltaS: 0.2,
      running: true,
      responseTimeS: 0.8,
    })
    const nearingSteady = deriveChargeSeparation({
      previous: 0.85,
      deltaS: 0.5,
      running: true,
      responseTimeS: 0.8,
    })

    expect(started).toBeGreaterThan(0)
    expect(nearingSteady).toBeGreaterThan(started)
    expect(nearingSteady).toBeLessThanOrEqual(1)
  })

  it('decays charge separation when power is disconnected', () => {
    const decayed = deriveChargeSeparation({
      previous: 0.9,
      deltaS: 0.3,
      running: false,
      responseTimeS: 0.8,
    })

    expect(decayed).toBeLessThan(0.9)
    expect(decayed).toBeGreaterThanOrEqual(0)
  })

  it('increases polarization target when magnetic field increases', () => {
    const lowField = derivePolarizationTarget({
      magneticFieldT: 0.4,
      plasmaVelocityMps: 2000,
    })
    const highField = derivePolarizationTarget({
      magneticFieldT: 2.4,
      plasmaVelocityMps: 2000,
    })

    expect(highField).toBeGreaterThan(lowField)
    expect(highField).toBeLessThanOrEqual(1)
  })

  it('scales the flow animation with the selected plasma speed', () => {
    expect(deriveMhdFlowAnimationScale(2000)).toBe(1)
    expect(deriveMhdFlowAnimationScale(200)).toBe(0.1)
    expect(deriveMhdFlowAnimationScale(4000)).toBe(2)
  })

  it('starts neutral carriers together, then separates them within the electrode gap', () => {
    expect(deriveCarrierDeflectionAmplitudeY(0, 0.1, 1)).toBe(0)
    expect(deriveCarrierDeflectionAmplitudeY(1, 0.1, 1)).toBeCloseTo(0.0295)
    expect(deriveCarrierDeflectionAmplitudeY(0.5, 0.4, 0.5)).toBeGreaterThan(0)
  })

  it('keeps plasma channel shell visually transparent for inner particle visibility', () => {
    const config = deriveChannelVisibilityConfig()

    expect(config.fluidOpacity).toBeLessThanOrEqual(0.12)
    expect(config.depthWrite).toBe(false)
    expect(config.particleRenderOrder).toBeGreaterThan(config.channelRenderOrder)
  })
})
