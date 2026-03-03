import { describe, expect, it } from 'vitest'
import {
  buildEquipotentialClouds,
  mapPotentialNonLinear,
  samplePotentialAtPoint,
  type EquipotentialCharge,
} from './model'

const DIPOLE_CHARGES: EquipotentialCharge[] = [
  { id: 'C1', x: -2, y: 0, z: 0, magnitude: 10 },
  { id: 'C2', x: 2, y: 0, z: 0, magnitude: -10 },
]

describe('equipotential model', () => {
  it('keeps mapped potential bounded by the configured soft limit', () => {
    expect(mapPotentialNonLinear(999, 20)).toBeLessThanOrEqual(20)
    expect(mapPotentialNonLinear(-999, 20)).toBeGreaterThanOrEqual(-20)
  })

  it('produces opposite potential signs near opposite charges', () => {
    const nearPositive = samplePotentialAtPoint(DIPOLE_CHARGES, { x: -1.7, y: 0, z: 0 }, 0.12, 24)
    const nearNegative = samplePotentialAtPoint(DIPOLE_CHARGES, { x: 1.7, y: 0, z: 0 }, 0.12, 24)

    expect(nearPositive).toBeGreaterThan(0)
    expect(nearNegative).toBeLessThan(0)
  })

  it('builds both positive and negative equipotential point clouds for a dipole', () => {
    const result = buildEquipotentialClouds({
      charges: DIPOLE_CHARGES,
      bounds: 5,
      resolution: 18,
      shellCount: 4,
      softeningFactor: 0.3,
      softPotentialLimit: 24,
    })

    expect(result.positiveSurfaces.length).toBeGreaterThan(0)
    expect(result.negativeSurfaces.length).toBeGreaterThan(0)
    expect(result.stats.positivePointCount).toBeGreaterThan(0)
    expect(result.stats.negativePointCount).toBeGreaterThan(0)
    expect(result.stats.maxPotential).toBeGreaterThan(0)
    expect(result.stats.minPotential).toBeLessThan(0)
  })
})
