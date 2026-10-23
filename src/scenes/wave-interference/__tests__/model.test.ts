import { describe, expect, it } from 'vitest'
import {
  calcWaveDisplacement,
  calcCombinedDisplacement,
  calcDistances,
  calcPhaseDiff,
  calcCombinedAmplitude,
  getInterferenceStatus,
  buildInterferenceBranches,
  createObserverBuffer,
  ringPush,
  ringToArrays,
  hasEqualWavelengths,
  worldToWavePlane,
  wrapPhase,
  DEFAULT_PARAMS,
  MAX_HISTORY,
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
    const t = Math.PI / 2 / omega
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

  it('drifts in time when wavelengths (and therefore frequencies) differ', () => {
    const params = { ...DEFAULT_PARAMS, wavelength2: 0.9 }
    const pos = { x: 0.4, z: 0.2 }
    const delta = calcPhaseDiff(pos, params, 1) - calcPhaseDiff(pos, params, 0)
    const expected = 2 * Math.PI * params.waveSpeed * (1 / params.wavelength1 - 1 / params.wavelength2)
    expect(delta).toBeCloseTo(expected, 8)
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
    // Stay within the destructive-phase tolerance around Δr = λ/2.
    const dr = 0.49 * DEFAULT_PARAMS.wavelength1
    const info = getInterferenceStatus(dr, DEFAULT_PARAMS)
    expect(info.type).toBe('destructive')
    expect(info.label).toContain('波节')
  })

  it('does not call a nonzero minimum a node when the source amplitudes differ', () => {
    const params = { ...DEFAULT_PARAMS, amplitude2: 0.1 }
    const info = getInterferenceStatus(0.49 * params.wavelength1, params)
    expect(info.type).toBe('destructive')
    expect(info.label).toContain('仍非零')
  })

  it('does not report a stationary node for unequal frequencies', () => {
    const params = { ...DEFAULT_PARAMS, wavelength2: 0.9 }
    const info = getInterferenceStatus(0, params, Math.PI)
    expect(info.type).toBe('destructive')
    expect(info.label).toContain('不是固定波节')
    expect(getInterferenceStatus(0, params).label).toContain('需按当前时刻')
  })
})

describe('calcCombinedDisplacement', () => {
  it('sums displacements from both sources', () => {
    const pos = { x: 0, z: 0 }
    const y = calcCombinedDisplacement(pos, DEFAULT_PARAMS, 0)
    const y1 = calcWaveDisplacement(
      pos,
      DEFAULT_PARAMS.source1,
      0,
      DEFAULT_PARAMS.wavelength1,
      DEFAULT_PARAMS.amplitude1,
    )
    const y2 = calcWaveDisplacement(
      pos,
      DEFAULT_PARAMS.source2,
      0,
      DEFAULT_PARAMS.wavelength2,
      DEFAULT_PARAMS.amplitude2,
    )
    expect(y).toBeCloseTo(y1 + y2, 10)
  })
})

describe('frequency and phase display helpers', () => {
  it('recognizes equal wavelengths as equal frequencies at fixed wave speed', () => {
    expect(hasEqualWavelengths(0.6, 0.6 + 1e-7)).toBe(true)
    expect(hasEqualWavelengths(0.6, 0.65)).toBe(false)
  })

  it('wraps phase into the readable interval [-π, π)', () => {
    expect(wrapPhase(5 * Math.PI)).toBeCloseTo(-Math.PI, 10)
    expect(wrapPhase(3.5 * Math.PI)).toBeCloseTo(-0.5 * Math.PI, 10)
  })

  it('maps positive world z to negative local plane y after the X rotation', () => {
    expect(worldToWavePlane({ x: 1.2, z: 0.7 })).toEqual({ x: 1.2, z: -0.7 })
  })
})

describe('observer ring buffer', () => {
  it('retains chronological timestamps aligned with the displacement samples', () => {
    const buffer = createObserverBuffer(0.25, -0.5)
    for (let i = 0; i < MAX_HISTORY + 2; i++) {
      ringPush(buffer, i / 10, i, -i, i + 1)
    }
    const series = ringToArrays(buffer)
    expect(series.history).toHaveLength(MAX_HISTORY)
    expect(series.historyTimes[0]).toBeCloseTo(0.2, 5)
    expect(series.historyTimes.at(-1)).toBeCloseTo((MAX_HISTORY + 1) / 10, 5)
    expect(series.history[0]).toBe(2)
    expect(series.history1[0]).toBe(-2)
  })
})

describe('fixed interference loci', () => {
  const source1 = { x: -0.8, z: 0 }
  const source2 = { x: 0.8, z: 0 }

  it('places constructive points on integral path-difference phase conditions', () => {
    const branches = buildInterferenceBranches(source1, source2, 0.6, 0.6, 0, 0)
    const points = branches.flat()
    expect(points.length).toBeGreaterThan(0)
    for (const [x, , z] of points) {
      const { dr } = calcDistances({ x, z }, source1, source2)
      expect(Math.abs(wrapPhase((2 * Math.PI * dr) / 0.6))).toBeLessThan(0.18)
    }
  })

  it('places destructive points on half-integral phase conditions including source phase', () => {
    const branches = buildInterferenceBranches(source1, source2, 0.6, 0.6, Math.PI, 0.5)
    const points = branches.flat()
    expect(points.length).toBeGreaterThan(0)
    for (const [x, , z] of points) {
      const { dr } = calcDistances({ x, z }, source1, source2)
      const phase = wrapPhase((2 * Math.PI * dr) / 0.6 + Math.PI)
      expect(Math.abs(Math.abs(phase) - Math.PI)).toBeLessThan(0.18)
    }
  })

  it('omits stationary loci for unequal wavelengths', () => {
    expect(buildInterferenceBranches(source1, source2, 0.6, 0.65, 0, 0)).toEqual([])
    expect(buildInterferenceBranches(source1, source1, 0.6, 0.6, 0, 0)).toEqual([])
  })
})
