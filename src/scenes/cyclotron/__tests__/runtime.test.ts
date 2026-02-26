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

  it('flips electric-field direction with crossing direction inside the gap', () => {
    const positiveCrossing = computeCyclotronAcceleration(
      {
        position: { x: 0.0005, y: 0, z: 0 },
        velocity: { x: 2, y: 1, z: 0 },
      },
      {
        chargeC: 2,
        massKg: 4,
        magneticFieldT: 5,
        electricFieldVPerM: 10,
        gapHalfWidthM: 0.001,
      },
    )

    const negativeCrossing = computeCyclotronAcceleration(
      {
        position: { x: -0.0005, y: 0, z: 0 },
        velocity: { x: -2, y: 1, z: 0 },
      },
      {
        chargeC: 2,
        massKg: 4,
        magneticFieldT: 5,
        electricFieldVPerM: 10,
        gapHalfWidthM: 0.001,
      },
    )

    expect(positiveCrossing.x).toBeCloseTo(0.5 * (1 * 5 + 10))
    expect(negativeCrossing.x).toBeCloseTo(0.5 * (1 * 5 - 10))
  })
})
