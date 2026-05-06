import { describe, expect, it, vi } from 'vitest'
import {
  computeFringeSpacing,
  DEFAULT_PARAMS,
  drawInterferencePattern,
  formatFringeSpacing,
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

    expect(ctx.fillRect).toHaveBeenCalled()
    expect(ctx.save).toHaveBeenCalled()
    expect(ctx.putImageData).toHaveBeenCalledTimes(1)
    expect(ctx.restore).toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalled()
  })
})
