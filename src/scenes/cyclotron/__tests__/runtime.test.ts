import { describe, expect, it } from 'vitest'
import { computeCyclotronAcceleration } from '../runtime'

describe('cyclotron runtime helpers', () => {
  it('applies electric acceleration only while particle crosses the dee gap', () => {
    const acceleration = computeCyclotronAcceleration(
      {
        position: { x: 0.003, y: 0, z: 0 },
        velocity: { x: 3, y: 4, z: 0 },
      },
      {
        chargeC: 2,
        massKg: 4,
        magneticFieldT: 5,
        electricFieldVPerM: 10,
        gapHalfWidthM: 0.001,
      },
    )

    expect(acceleration.x).toBeCloseTo(0.5 * (4 * 5))
    expect(acceleration.y).toBeCloseTo(0.5 * (-3 * 5))
    expect(acceleration.z).toBe(0)
  })

  it('synchronizes the gap-field reversal to the cyclotron period', () => {
    const config = {
      chargeC: 2,
      massKg: 4,
      magneticFieldT: 5,
      electricFieldVPerM: 10,
      gapHalfWidthM: 0.001,
    }
    const periodS = (2 * Math.PI * config.massKg) / (Math.abs(config.chargeC) * config.magneticFieldT)
    const positiveCrossing = computeCyclotronAcceleration(
      {
        position: { x: 0.0005, y: 0, z: 0 },
        velocity: { x: 2, y: 1, z: 0 },
      },
      config,
      0,
    )

    const negativeCrossing = computeCyclotronAcceleration(
      {
        position: { x: -0.0005, y: 0, z: 0 },
        velocity: { x: -2, y: 1, z: 0 },
      },
      config,
      periodS / 2,
    )

    expect(positiveCrossing.x).toBeCloseTo(0.5 * (1 * 5 + 10))
    expect(negativeCrossing.x).toBeCloseTo(0.5 * (1 * 5 - 10))
  })
})
