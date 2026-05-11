import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PARAMS,
  airyDiskRadius,
  circularApertureIntensity,
  circularObstacleIntensity,
  clampApertureSize,
  fastPow08,
  formatFeatureValue,
  formatWhiteLightFeatureValue,
  getApertureRange,
  gratingFirstOrderAngle,
  gratingIntensity,
  singleSlitCentralWidth,
  singleSlitIntensity,
  waveLengthToHex,
  waveLengthToRGB,
} from '../model'

describe('waveLengthToRGB', () => {
  it('returns black for out-of-range wavelengths', () => {
    expect(waveLengthToRGB(300)).toEqual([0, 0, 0])
    expect(waveLengthToRGB(900)).toEqual([0, 0, 0])
  })

  it('returns green at 532nm', () => {
    const rgb = waveLengthToRGB(532)
    expect(rgb[1]).toBe(255)
  })

  it('returns red at 700nm', () => {
    const [r, g, b] = waveLengthToRGB(700)
    expect(r).toBe(255)
    expect(g).toBe(0)
    expect(b).toBe(0)
  })
})

describe('waveLengthToHex', () => {
  it('converts 532nm to non-zero hex', () => {
    expect(waveLengthToHex(532)).toBeGreaterThan(0)
  })
})

describe('singleSlitIntensity', () => {
  it('returns 1.0 at center (y=0)', () => {
    expect(singleSlitIntensity(0, DEFAULT_PARAMS)).toBe(1.0)
  })

  it('decreases with larger y', () => {
    const center = singleSlitIntensity(0, DEFAULT_PARAMS)
    const offCenter = singleSlitIntensity(0.005, DEFAULT_PARAMS)
    expect(offCenter).toBeLessThan(center)
  })

  it('approaches zero at first minimum for default params', () => {
    const lambda = DEFAULT_PARAMS.wavelength * 1e-9
    const a = DEFAULT_PARAMS.apertureSize * 1e-3
    const L = DEFAULT_PARAMS.screenDistance
    const y1 = (lambda * L) / a // first minimum position
    const intensity = singleSlitIntensity(y1, DEFAULT_PARAMS)
    expect(intensity).toBeLessThan(0.01)
  })
})

describe('circularApertureIntensity', () => {
  it('returns 1.0 at center', () => {
    expect(circularApertureIntensity(0, DEFAULT_PARAMS)).toBe(1.0)
  })

  it('decreases away from center', () => {
    const center = circularApertureIntensity(0, DEFAULT_PARAMS)
    const offCenter = circularApertureIntensity(0.005, DEFAULT_PARAMS)
    expect(offCenter).toBeLessThan(center)
  })
})

describe('circularObstacleIntensity', () => {
  it('returns a visibly bright value at center (Poisson spot)', () => {
    const center = circularObstacleIntensity(0, DEFAULT_PARAMS)
    expect(center).toBeGreaterThan(0.2)
    expect(center).toBeLessThan(0.6)
  })

  it('has a bright Poisson spot at center for teaching visibility', () => {
    const center = circularObstacleIntensity(0, DEFAULT_PARAMS)
    const ring = circularObstacleIntensity(0.003, DEFAULT_PARAMS)
    // Teaching compromise: center is artificially brightened so the Poisson
    // spot is visible in the classroom demo, even though true Fraunhofer
    // limit gives a dark center.
    expect(center).toBeGreaterThan(ring)
  })
})

describe('gratingIntensity', () => {
  it('returns 1.0 at center (y=0)', () => {
    expect(gratingIntensity(0, DEFAULT_PARAMS)).toBe(1.0)
  })

  it('has distinct maxima at first-order positions', () => {
    const lambda = DEFAULT_PARAMS.wavelength * 1e-9
    const d = 1e-3 / DEFAULT_PARAMS.gratingLines
    const L = DEFAULT_PARAMS.screenDistance
    // Exact first-order: sin(θ) = λ/d, so y = L·asin(λ/d) for the internal θ=y/L mapping
    const y1 = L * Math.asin(lambda / d)
    const center = gratingIntensity(0, DEFAULT_PARAMS)
    const firstOrder = gratingIntensity(y1, DEFAULT_PARAMS)
    // At exact first-order the grating factor → 1, leaving only the single-slit envelope
    expect(firstOrder).toBeGreaterThan(0.1)
    expect(firstOrder).toBeLessThanOrEqual(center)
  })
})

describe('singleSlitCentralWidth', () => {
  it('increases with wavelength', () => {
    const narrow = singleSlitCentralWidth({ ...DEFAULT_PARAMS, wavelength: 400 })
    const wide = singleSlitCentralWidth({ ...DEFAULT_PARAMS, wavelength: 700 })
    expect(wide).toBeGreaterThan(narrow)
  })

  it('decreases with larger aperture', () => {
    const narrowAperture = singleSlitCentralWidth({ ...DEFAULT_PARAMS, apertureSize: 0.3 })
    const wideAperture = singleSlitCentralWidth({ ...DEFAULT_PARAMS, apertureSize: 0.05 })
    expect(wideAperture).toBeGreaterThan(narrowAperture)
  })
})

describe('airyDiskRadius', () => {
  it('increases with wavelength', () => {
    const small = airyDiskRadius({ ...DEFAULT_PARAMS, wavelength: 400 })
    const large = airyDiskRadius({ ...DEFAULT_PARAMS, wavelength: 700 })
    expect(large).toBeGreaterThan(small)
  })
})

describe('gratingFirstOrderAngle', () => {
  it('increases with wavelength', () => {
    const small = gratingFirstOrderAngle({ ...DEFAULT_PARAMS, wavelength: 400 })
    const large = gratingFirstOrderAngle({ ...DEFAULT_PARAMS, wavelength: 700 })
    expect(large).toBeGreaterThan(small)
  })

  it('returns 90° when wavelength exceeds grating spacing', () => {
    const params = { ...DEFAULT_PARAMS, wavelength: 800, gratingLines: 1500 }
    expect(gratingFirstOrderAngle(params)).toBe(90)
  })
})

describe('formatFeatureValue', () => {
  it('returns numeric width for single-slit', () => {
    const value = formatFeatureValue(DEFAULT_PARAMS, 'single-slit')
    expect(value).toContain('mm')
  })

  it('returns angle for diffraction-grating', () => {
    const value = formatFeatureValue(DEFAULT_PARAMS, 'diffraction-grating')
    expect(value).toContain('°')
  })
})

describe('formatWhiteLightFeatureValue', () => {
  it('returns a range for single-slit', () => {
    const value = formatWhiteLightFeatureValue(DEFAULT_PARAMS, 'single-slit')
    expect(value).toContain('–')
    expect(value).toContain('mm')
  })

  it('returns an angle range for diffraction-grating', () => {
    const value = formatWhiteLightFeatureValue(DEFAULT_PARAMS, 'diffraction-grating')
    expect(value).toContain('–')
    expect(value).toContain('°')
  })
})

describe('clampApertureSize', () => {
  it('clamps to mode range', () => {
    expect(clampApertureSize('single-slit', 0.5)).toBe(0.30)
    expect(clampApertureSize('single-slit', 0.01)).toBe(0.02)
  })
})

describe('getApertureRange', () => {
  it('returns different ranges for different modes', () => {
    const single = getApertureRange('single-slit')
    const circular = getApertureRange('circular-aperture')
    expect(single.max).not.toBe(circular.max)
  })
})

describe('fastPow08', () => {
  it('returns 0 for x <= 0', () => {
    expect(fastPow08(0)).toBe(0)
    expect(fastPow08(-1)).toBe(0)
  })

  it('returns 1 for x >= 1', () => {
    expect(fastPow08(1)).toBe(1)
    expect(fastPow08(2)).toBe(1)
  })

  it('is monotonically increasing in [0,1]', () => {
    const a = fastPow08(0.2)
    const b = fastPow08(0.5)
    const c = fastPow08(0.8)
    expect(a).toBeLessThan(b)
    expect(b).toBeLessThan(c)
  })
})
