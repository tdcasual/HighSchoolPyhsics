import { describe, expect, it } from 'vitest'
import {
  buildFieldLines,
  buildPotentialTerrain,
  sampleElectricFieldAt,
  samplePotentialTerrainHeight,
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

  it('keeps contour endpoints on the rendered terrain triangles', () => {
    const terrain = buildPotentialTerrain({
      charges: DIPOLE_CHARGES,
      bounds: 6,
      resolution: 24,
      contourLevels: [-2, -1, 0, 1, 2],
      heightScale: 0.47,
      invertHeight: true,
    })

    expect(terrain.contourSegments.length).toBeGreaterThan(0)
    for (const segment of terrain.contourSegments) {
      expect(segment.from[1]).toBeCloseTo(
        samplePotentialTerrainHeight(terrain, 6, { x: segment.from[0], z: segment.from[2] }) + 0.045,
        6,
      )
      expect(segment.to[1]).toBeCloseTo(
        samplePotentialTerrainHeight(terrain, 6, { x: segment.to[0], z: segment.to[2] }) + 0.045,
        6,
      )
    }
  })

  it('samples the same triangle split used by the rendered terrain mesh', () => {
    const bounds = 6
    const resolution = 24
    const terrain = buildPotentialTerrain({
      charges: DIPOLE_CHARGES,
      bounds,
      resolution,
      contourLevels: [],
    })
    const step = (bounds * 2) / (resolution - 1)
    const xIndex = 3
    const zIndex = 5
    const yAt = (x: number, z: number) => terrain.vertexPositions[(z * resolution + x) * 3 + 1]
    const y00 = yAt(xIndex, zIndex)
    const y10 = yAt(xIndex + 1, zIndex)
    const y01 = yAt(xIndex, zIndex + 1)
    const y11 = yAt(xIndex + 1, zIndex + 1)
    const firstPoint = { x: -bounds + (xIndex + 0.2) * step, z: -bounds + (zIndex + 0.3) * step }
    const secondPoint = { x: -bounds + (xIndex + 0.8) * step, z: -bounds + (zIndex + 0.7) * step }

    expect(samplePotentialTerrainHeight(terrain, bounds, firstPoint)).toBeCloseTo(
      y00 * 0.5 + y10 * 0.2 + y01 * 0.3,
      6,
    )
    expect(samplePotentialTerrainHeight(terrain, bounds, secondPoint)).toBeCloseTo(
      y10 * 0.3 + y01 * 0.2 + y11 * 0.5,
      6,
    )
  })

  it('deduplicates exact zero-contour segments on a symmetric grid', () => {
    const terrain = buildPotentialTerrain({
      charges: DIPOLE_CHARGES,
      bounds: 6,
      resolution: 19,
      contourLevels: [0],
    })
    const pointKey = (point: [number, number, number]) => point.map((value) => value.toFixed(5)).join(',')
    const segmentKeys = terrain.contourSegments.map((segment) =>
      [pointKey(segment.from), pointKey(segment.to)].sort().join('|'),
    )

    expect(segmentKeys.length).toBeGreaterThan(0)
    expect(new Set(segmentKeys).size).toBe(segmentKeys.length)
    for (const segment of terrain.contourSegments) {
      expect(Math.hypot(segment.to[0] - segment.from[0], segment.to[2] - segment.from[2])).toBeGreaterThan(1e-7)
    }
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
