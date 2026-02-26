import { describe, expect, it } from 'vitest'
import {
  deriveCyclotronLaunchState,
  deriveCyclotronReadings,
  stepCyclotronState,
  type CyclotronConfig,
} from './model'

describe('cyclotron model', () => {
  it('changes velocity direction in magnetic field with near-constant speed', () => {
    const config: CyclotronConfig = {
      chargeC: 1,
      massKg: 1,
      magneticFieldT: 2,
      electricFieldVPerM: 0,
      gapHalfWidthM: 0.2,
    }

    let state = {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 1, y: 0, z: 0 },
    }

    for (let i = 0; i < 1000; i += 1) {
      state = stepCyclotronState(state, config, 0.001)
    }

    const speed = Math.hypot(state.velocity.x, state.velocity.y, state.velocity.z)
    expect(speed).toBeCloseTo(1, 2)
    expect(Math.abs(state.velocity.y)).toBeGreaterThan(0.1)
  })

  it('derives period by 2πm/(qB)', () => {
    const config: CyclotronConfig = {
      chargeC: 2,
      massKg: 4,
      magneticFieldT: 0.5,
      electricFieldVPerM: 0,
      gapHalfWidthM: 0.2,
    }

    const readings = deriveCyclotronReadings(
      {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 3, y: 4, z: 0 },
      },
      config,
    )

    expect(readings.speed).toBe(5)
    expect(readings.periodS).toBeCloseTo(2 * Math.PI * 4 / (2 * 0.5))
  })

  it('launches from gap center line with adaptive y-offset so guiding center is at origin', () => {
    const config: CyclotronConfig = {
      chargeC: 1.6e-19,
      massKg: 1.67e-27,
      magneticFieldT: 1.2,
      electricFieldVPerM: 8e4,
      gapHalfWidthM: 0.1e-3,
    }

    const launch = deriveCyclotronLaunchState(config, 2.4e4)
    const omega = (Math.abs(config.chargeC) * Math.abs(config.magneticFieldT)) / config.massKg
    const guidingCenterX = launch.position.x + launch.velocity.y / omega
    const guidingCenterY = launch.position.y - launch.velocity.x / omega

    expect(launch.position.x).toBeCloseTo(0, 12)
    expect(launch.velocity.x).toBe(2.4e4)
    expect(launch.velocity.y).toBeCloseTo(0, 12)
    expect(Math.abs(guidingCenterX)).toBeLessThanOrEqual(config.gapHalfWidthM * 0.2)
    expect(guidingCenterY).toBeCloseTo(0, 8)
  })
})
