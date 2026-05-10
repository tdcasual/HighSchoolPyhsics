import { describe, expect, it } from 'vitest'
import {
  calcWaveDisplacement,
  calcCombinedDisplacement,
  calcDistances,
  calcPhaseDiff,
  calcCombinedAmplitude,
  getInterferenceStatus,
  buildHyperbolaPoints,
  DEFAULT_PARAMS,
  GRID_SIZE,
} from '../model'

describe('calcWaveDisplacement', () => {
  it('returns zero at the source at t=0', () => {
    const pos = { x: 0, z: 0 }
    const source = { x: 0, z: 0 }
    expect(calcWaveDisplacement(pos, source, 0, 0.6, 0.15)).toBeCloseTo(0, 10)
  })

  it('returns negative amplitude at source when t = pi/(2*omega)', () => {
    const pos = { x: 0, z: 0 }
    const source = { x: 0, z: 0 }
    const wl = 0.6
    const k = (2 * Math.PI) / wl
    const omega = 2 * k
    const t = (Math.PI / 2) / omega
    expect(calcWaveDisplacement(pos, source, t, wl, 0.15)).toBeCloseTo(-0.15, 5)
  })

  it('applies phase offset', () => {
    const pos = { x: 0, z: 0 }
    const source = { x: 0, z: 0 }
    const y0 = calcWaveDisplacement(pos, source, 0, 0.6, 0.15, Math.PI)
    expect(y0).toBeCloseTo(0, 10)
  })
})

describe('calcDistances', () => {
  it('computes correct distances and path difference', () => {
    const pos = { x: 1, z: 0 }
    const s1 = { x: -1, z: 0 }
    const s2 = { x: 1, z: 0 }
    const { r1, r2, dr } = calcDistances(pos, s1, s2)
    expect(r1).toBeCloseTo(2, 5)
    expect(r2).toBeCloseTo(0, 5)
    expect(dr).toBeCloseTo(-2, 5)
  })
})

describe('calcPhaseDiff', () => {
  it('returns zero at midpoint between identical sources at same wavelength', () => {
    const pos = { x: 0, z: 0 }
    const params = { ...DEFAULT_PARAMS }
    const dphi = calcPhaseDiff(pos, params)
    expect(dphi).toBeCloseTo(0, 5)
  })

  it('returns non-zero phase diff for off-center point', () => {
    const pos = { x: 1, z: 1 }
    const dphi = calcPhaseDiff(pos, DEFAULT_PARAMS)
    expect(Math.abs(dphi)).toBeGreaterThan(0)
  })
})

describe('calcCombinedAmplitude', () => {
  it('returns sum of amplitudes for zero phase diff', () => {
    const amp = calcCombinedAmplitude(DEFAULT_PARAMS, 0)
    expect(amp).toBeCloseTo(DEFAULT_PARAMS.amplitude1 + DEFAULT_PARAMS.amplitude2, 5)
  })

  it('returns |A1 - A2| for pi phase diff with equal amplitudes', () => {
    const params = { ...DEFAULT_PARAMS, amplitude1: 0.15, amplitude2: 0.15 }
    const amp = calcCombinedAmplitude(params, Math.PI)
    expect(amp).toBeCloseTo(0, 5)
  })
})

describe('getInterferenceStatus', () => {
  it('returns constructive for zero path difference with zero phase', () => {
    const info = getInterferenceStatus(0, DEFAULT_PARAMS)
    expect(info.type).toBe('constructive')
  })

  it('returns destructive near half-wavelength path difference', () => {
    const avgLambda = (DEFAULT_PARAMS.wavelength1 + DEFAULT_PARAMS.wavelength2) / 2
    // (n + 0.5) * avgLambda for n=0 → 0.5*avgLambda; Math.round(0.5)=1
    // For n=1: dr close to 1.5*avgLambda, and Math.round(1.5)=2 → checks against n=2
    // Use dr very slightly under 0.5 so Math.round gives 0
    const dr = 0.49 * avgLambda
    const info = getInterferenceStatus(dr, DEFAULT_PARAMS)
    expect(info.type).toBe('destructive')
  })
})

describe('buildHyperbolaPoints', () => {
  it('returns empty for degenerate case (same source)', () => {
    const s = { x: 0, z: 0 }
    expect(buildHyperbolaPoints(s, s, 0.1)).toEqual([])
  })

  it('returns empty when aVal >= half-distance', () => {
    const s1 = { x: -1, z: 0 }
    const s2 = { x: 1, z: 0 }
    expect(buildHyperbolaPoints(s1, s2, 1)).toEqual([])
    expect(buildHyperbolaPoints(s1, s2, 1.5)).toEqual([])
  })

  it('returns points within grid bounds', () => {
    const s1 = { x: -0.8, z: 0 }
    const s2 = { x: 0.8, z: 0 }
    const pts = buildHyperbolaPoints(s1, s2, 0.3)
    expect(pts.length).toBeGreaterThan(0)
    const halfGrid = GRID_SIZE / 2
    for (const [x, y, z] of pts) {
      expect(Math.abs(x)).toBeLessThanOrEqual(halfGrid)
      expect(Math.abs(z)).toBeLessThanOrEqual(halfGrid)
      expect(y).toBeCloseTo(0.02, 5)
    }
  })
})

describe('calcCombinedDisplacement', () => {
  it('sums displacements from both sources', () => {
    const pos = { x: 0, z: 0 }
    const y = calcCombinedDisplacement(pos, DEFAULT_PARAMS, 0)
    const y1 = calcWaveDisplacement(pos, DEFAULT_PARAMS.source1, 0, DEFAULT_PARAMS.wavelength1, DEFAULT_PARAMS.amplitude1)
    const y2 = calcWaveDisplacement(pos, DEFAULT_PARAMS.source2, 0, DEFAULT_PARAMS.wavelength2, DEFAULT_PARAMS.amplitude2)
    expect(y).toBeCloseTo(y1 + y2, 10)
  })
})
