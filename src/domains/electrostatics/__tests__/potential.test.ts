import { describe, expect, it } from 'vitest'
import { sampleElectricField2D } from '../field'
import { samplePotential2D, samplePotential3D } from '../potential'

describe('electrostatics potential sampling', () => {
  it('keeps opposite signs near opposite charges in 2D and 3D sampling', () => {
    const charges2D = [
      { id: 'C1', x: -2, z: 0, magnitude: 3 },
      { id: 'C2', x: 2, z: 0, magnitude: -3 },
    ]
    const nearPositive2D = samplePotential2D(charges2D, { x: -1.55, z: 0 })
    const nearNegative2D = samplePotential2D(charges2D, { x: 1.55, z: 0 })

    expect(nearPositive2D).toBeGreaterThan(0)
    expect(nearNegative2D).toBeLessThan(0)

    const charges3D = [
      { id: 'C1', x: -2, y: 0, z: 0, magnitude: 10 },
      { id: 'C2', x: 2, y: 0, z: 0, magnitude: -10 },
    ]
    const nearPositive3D = samplePotential3D(charges3D, { x: -1.7, y: 0, z: 0 }, { softening: 0.12, nonLinearLimit: 24 })
    const nearNegative3D = samplePotential3D(charges3D, { x: 1.7, y: 0, z: 0 }, { softening: 0.12, nonLinearLimit: 24 })

    expect(nearPositive3D).toBeGreaterThan(0)
    expect(nearNegative3D).toBeLessThan(0)
  })

  it('returns finite electric field samples around high-gradient points', () => {
    const charges = [
      { id: 'C1', x: -2, z: 0, magnitude: 3 },
      { id: 'C2', x: 2, z: 0, magnitude: -3 },
    ]

    const nearCharge = sampleElectricField2D(charges, { x: -1.98, z: 0.02 }, { softening: 0.2 })
    const midline = sampleElectricField2D(charges, { x: 0, z: 0 }, { softening: 0.24 })

    expect(Number.isFinite(nearCharge.ex)).toBe(true)
    expect(Number.isFinite(nearCharge.ez)).toBe(true)
    expect(Number.isFinite(nearCharge.magnitude)).toBe(true)
    expect(midline.magnitude).toBeGreaterThan(0)
    expect(midline.ex).toBeGreaterThan(0)
  })
})
