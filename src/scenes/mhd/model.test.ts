import { describe, expect, it } from 'vitest'
import {
  deriveChannelVisibilityConfig,
  deriveChargeSeparation,
  deriveMhdReadings,
  derivePolarizationTarget,
} from './model'

describe('mhd model', () => {
  it('derives induced electric field and output voltage from v x B', () => {
    const readings = deriveMhdReadings({
      magneticFieldT: 1.5,
      plasmaVelocityMps: 2000,
      electrodeGapM: 0.4,
      conductivitySPerM: 18,
    })

    expect(readings.inducedElectricFieldVPerM).toBeCloseTo(3000)
    expect(readings.outputVoltageV).toBeCloseTo(1200)
    expect(readings.currentDensityApm2).toBeCloseTo(54000)
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

  it('keeps plasma channel shell visually transparent for inner particle visibility', () => {
    const config = deriveChannelVisibilityConfig()

    expect(config.fluidOpacity).toBeLessThanOrEqual(0.12)
    expect(config.depthWrite).toBe(false)
    expect(config.particleRenderOrder).toBeGreaterThan(config.channelRenderOrder)
  })
})
