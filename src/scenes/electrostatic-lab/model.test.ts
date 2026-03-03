import { describe, expect, it } from 'vitest'
import {
  buildFieldLines,
  buildPotentialTerrain,
  sampleElectricFieldAt,
  samplePotentialAt,
  type ElectrostaticCharge,
  PRESET_CONFIGS,
} from './model'

const DIPOLE_CHARGES: ElectrostaticCharge[] = [
  { id: 'P1', x: -2, z: 0, magnitude: 3 },
  { id: 'N1', x: 2, z: 0, magnitude: -3 },
]

describe('electrostatic-lab model', () => {
  it('produces opposite potential signs near opposite charges', () => {
    const nearPositive = samplePotentialAt(DIPOLE_CHARGES, { x: -1.55, z: 0 })
    const nearNegative = samplePotentialAt(DIPOLE_CHARGES, { x: 1.55, z: 0 })

    expect(nearPositive).toBeGreaterThan(0)
    expect(nearNegative).toBeLessThan(0)
  })

  it('computes electric field direction toward negative charge in dipole midline', () => {
    const field = sampleElectricFieldAt(DIPOLE_CHARGES, { x: 0, z: 0 })

    expect(field.magnitude).toBeGreaterThan(0)
    expect(field.ex).toBeGreaterThan(0)
  })

  it('builds a colored potential terrain with contour segments', () => {
    const terrain = buildPotentialTerrain({
      charges: DIPOLE_CHARGES,
      bounds: 6,
      resolution: 24,
      contourLevels: [-2, -1, 0, 1, 2],
    })

    expect(terrain.vertexPositions.length).toBeGreaterThan(0)
    expect(terrain.indices.length).toBeGreaterThan(0)
    expect(terrain.contourSegments.length).toBeGreaterThan(0)
    expect(terrain.stats.minPotential).toBeLessThan(0)
    expect(terrain.stats.maxPotential).toBeGreaterThan(0)
  })

  it('builds field lines for dipole preset', () => {
    const lines = buildFieldLines({
      charges: DIPOLE_CHARGES,
      bounds: 7,
      maxSteps: 180,
      seedsPerCharge: 8,
      stepSize: 0.2,
    })

    expect(lines.length).toBeGreaterThan(0)
    expect(lines.some((line) => line.length > 8)).toBe(true)
  })

  it('ships required teaching presets from source demo intent', () => {
    expect(PRESET_CONFIGS.dipole.charges).toHaveLength(2)
    expect(PRESET_CONFIGS.quadrupole.charges).toHaveLength(4)
    expect(PRESET_CONFIGS['three-linear'].charges).toHaveLength(3)
  })
})
