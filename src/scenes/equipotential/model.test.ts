import { describe, expect, it } from 'vitest'
import {
  buildEquipotentialSurfaces,
  samplePotentialAtPoint,
  type EquipotentialCharge,
} from './model'

const DIPOLE_CHARGES: EquipotentialCharge[] = [
  { id: 'C1', x: -2, y: 0, z: 0, magnitude: 10 },
  { id: 'C2', x: 2, y: 0, z: 0, magnitude: -10 },
]

function undirectedEdgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

function hasClosedEdgeIncidence(indices: Uint32Array): boolean {
  const edgeCounts = new Map<string, number>()
  for (let offset = 0; offset < indices.length; offset += 3) {
    const a = indices[offset] ?? 0
    const b = indices[offset + 1] ?? 0
    const c = indices[offset + 2] ?? 0
    for (const key of [undirectedEdgeKey(a, b), undirectedEdgeKey(b, c), undirectedEdgeKey(c, a)]) {
      edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1)
    }
  }
  return edgeCounts.size > 0 && [...edgeCounts.values()].every((count) => count === 2)
}

describe('equipotential model', () => {
  it('keeps potential linear in relative charge magnitude', () => {
    const doubledDipole = DIPOLE_CHARGES.map((charge) => ({ ...charge, magnitude: charge.magnitude * 2 }))
    const original = samplePotentialAtPoint(DIPOLE_CHARGES, { x: 0, y: 0.5, z: 0 }, 0.12)
    const doubled = samplePotentialAtPoint(doubledDipole, { x: 0, y: 0.5, z: 0 }, 0.12)
    expect(doubled).toBeCloseTo(original * 2, 8)
  })

  it('produces opposite potential signs near opposite charges', () => {
    const nearPositive = samplePotentialAtPoint(DIPOLE_CHARGES, { x: -1.7, y: 0, z: 0 }, 0.12)
    const nearNegative = samplePotentialAtPoint(DIPOLE_CHARGES, { x: 1.7, y: 0, z: 0 }, 0.12)

    expect(nearPositive).toBeGreaterThan(0)
    expect(nearNegative).toBeLessThan(0)
  })

  it('extracts positive and negative triangulated surfaces for a dipole', () => {
    const result = buildEquipotentialSurfaces({
      charges: DIPOLE_CHARGES,
      bounds: 5,
      resolution: 18,
      shellCount: 4,
      softeningEpsilon: 0.18,
    })

    expect(result.positiveSurfaces.length).toBeGreaterThan(0)
    expect(result.negativeSurfaces.length).toBeGreaterThan(0)
    expect(result.stats.positiveTriangleCount).toBeGreaterThan(0)
    expect(result.stats.negativeTriangleCount).toBeGreaterThan(0)
    expect(result.stats.maxPotential).toBeGreaterThan(0)
    expect(result.stats.minPotential).toBeLessThan(0)
    expect(result.positiveSurfaces.every((surface) => surface.isoValue > 0)).toBe(true)
    expect(result.negativeSurfaces.every((surface) => surface.isoValue < 0)).toBe(true)
  })

  it('creates a closed, non-degenerate sphere with vertices on the requested potential level', () => {
    const charge: EquipotentialCharge = { id: 'C1', x: 0, y: 0, z: 0, magnitude: 10 }
    const result = buildEquipotentialSurfaces({
      charges: [charge],
      bounds: 3,
      resolution: 24,
      shellCount: 3,
      softeningEpsilon: 0.18,
    })
    const surface = result.positiveSurfaces[0]
    expect(surface).toBeDefined()
    expect(surface?.indices.length).toBeGreaterThan(0)
    expect(surface?.indices.length % 3).toBe(0)
    expect(surface?.triangleCount).toBe((surface?.indices.length ?? 0) / 3)

    if (!surface) return
    const edgeCounts = new Map<string, number>()
    for (let offset = 0; offset < surface.indices.length; offset += 3) {
      const a = surface.indices[offset] ?? 0
      const b = surface.indices[offset + 1] ?? 0
      const c = surface.indices[offset + 2] ?? 0
      for (const key of [undirectedEdgeKey(a, b), undirectedEdgeKey(b, c), undirectedEdgeKey(c, a)]) {
        edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1)
      }
      const ax = surface.positions[a * 3] ?? 0
      const ay = surface.positions[a * 3 + 1] ?? 0
      const az = surface.positions[a * 3 + 2] ?? 0
      const bx = surface.positions[b * 3] ?? 0
      const by = surface.positions[b * 3 + 1] ?? 0
      const bz = surface.positions[b * 3 + 2] ?? 0
      const cx = surface.positions[c * 3] ?? 0
      const cy = surface.positions[c * 3 + 1] ?? 0
      const cz = surface.positions[c * 3 + 2] ?? 0
      const areaTwice = Math.hypot(
        (by - ay) * (cz - az) - (bz - az) * (cy - ay),
        (bz - az) * (cx - ax) - (bx - ax) * (cz - az),
        (bx - ax) * (cy - ay) - (by - ay) * (cx - ax),
      )
      expect(areaTwice).toBeGreaterThan(1e-8)
    }
    expect([...edgeCounts.values()].every((count) => count === 2)).toBe(true)

    let maxPotentialError = 0
    for (let offset = 0; offset < surface.positions.length; offset += 3) {
      const potential = samplePotentialAtPoint(
        [charge],
        { x: surface.positions[offset] ?? 0, y: surface.positions[offset + 1] ?? 0, z: surface.positions[offset + 2] ?? 0 },
        0.18,
      )
      maxPotentialError = Math.max(maxPotentialError, Math.abs(potential - surface.isoValue))
    }
    expect(maxPotentialError).toBeLessThan(0.5)
  })

  it('keeps both-polarity shells closed on coarse grids and near the allowed domain edge', () => {
    const cases: EquipotentialCharge[][] = [
      [{ id: 'C1', x: 0, y: 0, z: 0, magnitude: 10 }],
      [{ id: 'C1', x: 3, y: 2.5, z: -2.4, magnitude: 10 }],
      DIPOLE_CHARGES,
    ]

    for (const charges of cases) {
      const result = buildEquipotentialSurfaces({
        charges,
        bounds: 5,
        resolution: 14,
        shellCount: 6,
        softeningEpsilon: 0.18,
      })
      const allSurfaces = [...result.positiveSurfaces, ...result.negativeSurfaces]

      expect(allSurfaces.length).toBeGreaterThan(0)
      expect(allSurfaces.every((surface) => hasClosedEdgeIncidence(surface.indices))).toBe(true)
      expect(allSurfaces.every((surface) => Array.from(surface.positions).every((coordinate) => Math.abs(coordinate) < 5))).toBe(true)
      if (charges.some((charge) => charge.magnitude > 0)) expect(result.positiveSurfaces).toHaveLength(6)
      if (charges.some((charge) => charge.magnitude < 0)) expect(result.negativeSurfaces).toHaveLength(6)
    }
  })

  it('returns empty finite results for zero charges and sanitizes invalid grid controls', () => {
    const zeroCharge: EquipotentialCharge = { id: 'C0', x: 0, y: 0, z: 0, magnitude: 0 }
    const empty = buildEquipotentialSurfaces({
      charges: [zeroCharge], bounds: 5, resolution: 20, shellCount: 4,
      softeningEpsilon: 0.18,
    })
    expect(empty.positiveSurfaces).toHaveLength(0)
    expect(empty.negativeSurfaces).toHaveLength(0)
    expect(empty.stats.minPotential).toBe(0)
    expect(empty.stats.maxPotential).toBe(0)

    const sanitized = buildEquipotentialSurfaces({
      charges: [{ id: 'C1', x: 0, y: 0, z: 0, magnitude: 10 }],
      bounds: Number.NaN,
      resolution: Number.NaN,
      shellCount: Number.POSITIVE_INFINITY,
      softeningEpsilon: Number.NaN,
    })
    expect(Number.isFinite(sanitized.stats.minPotential)).toBe(true)
    expect(Number.isFinite(sanitized.stats.maxPotential)).toBe(true)
    expect(sanitized.positiveSurfaces.length).toBeGreaterThan(0)
  })
})
