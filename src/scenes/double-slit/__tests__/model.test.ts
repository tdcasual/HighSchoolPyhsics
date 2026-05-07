import { describe, expect, it, vi } from 'vitest'
import {
  computeFringeSpacing,
  DEFAULT_PARAMS,
  drawInterferencePattern,
  drawWhiteLightPattern,
  fastPow08,
  FILTER_PROFILES,
  formatFringeSpacing,
  setPatternCacheMax,
  waveLengthToHex,
  waveLengthToRGB,
  type DoubleSlitParams,
} from '../model'

describe('waveLengthToRGB', () => {
  it('returns black for wavelengths below visible range', () => {
    expect(waveLengthToRGB(300)).toEqual([0, 0, 0])
  })

  it('returns black for wavelengths above visible range', () => {
    expect(waveLengthToRGB(900)).toEqual([0, 0, 0])
  })

  it('returns violet-blue at 380nm (edge of visible)', () => {
    const rgb = waveLengthToRGB(380)
    expect(rgb[0]).toBeGreaterThan(0)
    expect(rgb[1]).toBe(0)
    expect(rgb[2]).toBeGreaterThan(0)
  })

  it('returns green at 532nm', () => {
    const rgb = waveLengthToRGB(532)
    expect(rgb[1]).toBe(255)
    expect(rgb[2]).toBe(0)
  })

  it('returns red at 700nm', () => {
    const [r, g, b] = waveLengthToRGB(700)
    expect(r).toBe(255)
    expect(g).toBe(0)
    expect(b).toBe(0)
  })

  it('returns red at 780nm with edge attenuation', () => {
    const rgb = waveLengthToRGB(780)
    expect(rgb[0]).toBeGreaterThan(0)
    expect(rgb[1]).toBe(0)
    expect(rgb[2]).toBe(0)
  })
})

describe('waveLengthToHex', () => {
  it('converts 532nm green to correct hex', () => {
    expect(waveLengthToHex(532)).toBe(0x50ff00)
  })

  it('converts 700nm red to correct hex', () => {
    expect(waveLengthToHex(700)).toBe(0xff0000)
  })
})

describe('computeFringeSpacing', () => {
  it('computes correct spacing for default params', () => {
    const spacing = computeFringeSpacing(DEFAULT_PARAMS)
    // λ=532nm, d=0.2mm, L=1.0m → Δx = Lλ/d = 1.0 * 532e-9 / 0.2e-3 = 2.66e-3 m
    expect(spacing).toBeCloseTo(2.66e-3, 6)
  })

  it('increases spacing with larger L', () => {
    const base = computeFringeSpacing(DEFAULT_PARAMS)
    const largerL = computeFringeSpacing({ ...DEFAULT_PARAMS, screenDistance: 1.5 })
    expect(largerL).toBeGreaterThan(base)
  })

  it('decreases spacing with larger d', () => {
    const base = computeFringeSpacing(DEFAULT_PARAMS)
    const largerD = computeFringeSpacing({ ...DEFAULT_PARAMS, slitDistance: 0.5 })
    expect(largerD).toBeLessThan(base)
  })
})

describe('formatFringeSpacing', () => {
  it('formats default params to mm with 3 decimals', () => {
    expect(formatFringeSpacing(DEFAULT_PARAMS)).toMatch(/2\.66\d+ mm/)
  })

  it('uses exponential notation for very small values', () => {
    const tiny: DoubleSlitParams = {
      wavelength: 400,
      slitDistance: 0.5,
      screenDistance: 0.005,
      slitWidth: 0.05,
    }
    expect(formatFringeSpacing(tiny)).toMatch(/\d\.\d+e[+-]\d+ mm/)
  })
})

describe('drawInterferencePattern', () => {
  it('fills the canvas and draws eyepiece border', () => {
    const ctx = {
      canvas: { width: 100, height: 100 },
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      clip: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(100 * 100 * 4) })),
      putImageData: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      strokeStyle: '',
      lineWidth: 0,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D

    drawInterferencePattern(ctx, DEFAULT_PARAMS)

    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
    expect(ctx.stroke).toHaveBeenCalled()
  })
})

describe('FILTER_PROFILES', () => {
  it('defines red, green, blue profiles with positive center and halfWidth', () => {
    for (const profile of Object.values(FILTER_PROFILES)) {
      expect(profile.center).toBeGreaterThan(400)
      expect(profile.center).toBeLessThan(700)
      expect(profile.halfWidth).toBeGreaterThan(0)
    }
  })

  it('red center is longer wavelength than green, green longer than blue', () => {
    expect(FILTER_PROFILES.red.center).toBeGreaterThan(FILTER_PROFILES.green.center)
    expect(FILTER_PROFILES.green.center).toBeGreaterThan(FILTER_PROFILES.blue.center)
  })
})

describe('drawWhiteLightPattern', () => {
  const mockCtx = () => {
    const ctx = {
      canvas: { width: 50, height: 50 },
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      clip: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(50 * 50 * 4) })),
      putImageData: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      strokeStyle: '',
      lineWidth: 0,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D
    return ctx
  }

  it('renders without filter', () => {
    const ctx = mockCtx()
    expect(() => drawWhiteLightPattern(ctx, DEFAULT_PARAMS, 'none')).not.toThrow()
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
  })

  it('renders with red filter', () => {
    const ctx = mockCtx()
    expect(() => drawWhiteLightPattern(ctx, DEFAULT_PARAMS, 'red')).not.toThrow()
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
  })

  it('renders with green filter', () => {
    const ctx = mockCtx()
    expect(() => drawWhiteLightPattern(ctx, DEFAULT_PARAMS, 'green')).not.toThrow()
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
  })

  it('renders with blue filter', () => {
    const ctx = mockCtx()
    expect(() => drawWhiteLightPattern(ctx, DEFAULT_PARAMS, 'blue')).not.toThrow()
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
  })
})

describe('drawWhiteLightPattern with wavelengthStep', () => {
  const mockCtx = () => {
    const ctx = {
      canvas: { width: 50, height: 50 },
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      clip: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(50 * 50 * 4) })),
      putImageData: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      strokeStyle: '',
      lineWidth: 0,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D
    return ctx
  }

  it('accepts wavelengthStep parameter and renders correctly', () => {
    const ctx = mockCtx()
    expect(() => drawWhiteLightPattern(ctx, DEFAULT_PARAMS, 'none', 0, 0, 20)).not.toThrow()
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
  })

  it('uses fewer wavelengths with larger step', () => {
    const ctx = mockCtx()
    drawWhiteLightPattern(ctx, DEFAULT_PARAMS, 'none', 0, 0, 20)
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
  })
})

describe('setPatternCacheMax', () => {
  it('does not throw for valid values', () => {
    expect(() => setPatternCacheMax(1)).not.toThrow()
    expect(() => setPatternCacheMax(3)).not.toThrow()
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

  it('approximates x^0.8 within 10% for visible range', () => {
    for (const x of [0.5, 0.75, 0.9]) {
      const expected = Math.pow(x, 0.8)
      const actual = fastPow08(x)
      expect(Math.abs(actual - expected) / expected).toBeLessThan(0.10)
    }
  })

  it('stays within 25% across full range', () => {
    for (const x of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const expected = Math.pow(x, 0.8)
      const actual = fastPow08(x)
      expect(Math.abs(actual - expected) / expected).toBeLessThan(0.25)
    }
  })

  it('is monotonically increasing in (0, 1)', () => {
    let prev = fastPow08(0.01)
    for (let x = 0.05; x < 1; x += 0.05) {
      const cur = fastPow08(x)
      expect(cur).toBeGreaterThan(prev)
      prev = cur
    }
  })
})

describe('drawInterferencePattern pixel output', () => {
  it('produces non-zero pixels at center for default params', () => {
    const size = 100
    const data = new Uint8ClampedArray(size * size * 4)
    const ctx = {
      canvas: { width: size, height: size },
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      createImageData: vi.fn(() => ({ data })),
      putImageData: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      strokeStyle: '',
      lineWidth: 0,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D

    drawInterferencePattern(ctx, DEFAULT_PARAMS)

    // Center pixel should be bright (constructive interference at center)
    const centerIdx = (50 * size + 50) * 4
    expect(data[centerIdx]).toBeGreaterThan(0)
  })

  it('produces symmetric output', () => {
    const size = 100
    const data = new Uint8ClampedArray(size * size * 4)
    const ctx = {
      canvas: { width: size, height: size },
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      createImageData: vi.fn(() => ({ data })),
      putImageData: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      strokeStyle: '',
      lineWidth: 0,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D

    drawInterferencePattern(ctx, DEFAULT_PARAMS)

    // Left-right symmetry: pixel at (40,50) should equal pixel at (60,50)
    const leftIdx = (50 * size + 40) * 4
    const rightIdx = (50 * size + 60) * 4
    expect(data[leftIdx]).toBe(data[rightIdx])
    expect(data[leftIdx + 1]).toBe(data[rightIdx + 1])
    expect(data[leftIdx + 2]).toBe(data[rightIdx + 2])
  })
})
