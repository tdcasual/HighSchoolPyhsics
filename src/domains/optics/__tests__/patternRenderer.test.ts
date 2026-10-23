import { describe, expect, it, vi } from 'vitest'
import { createPatternRenderer } from '../patternRenderer'

function canvas(size: number) {
  const frames: Uint8ClampedArray[] = []
  const ctx = {
    canvas: { width: size, height: size },
    createImageData: vi.fn((w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h })),
    putImageData: vi.fn((image: ImageData) => frames.push(new Uint8ClampedArray(image.data))),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    strokeStyle: '',
    lineWidth: 0,
    fillStyle: '',
  } as unknown as CanvasRenderingContext2D
  return { ctx, frames }
}

const red = (frame: Uint8ClampedArray, size: number, x: number, y: number) => frame[(y * size + x) * 4]

describe('optics pattern renderer', () => {
  it('lights a strip fully and the screen around it faintly', () => {
    const { ctx, frames } = canvas(40)
    createPatternRenderer().drawMonochrome(ctx, 'strip', 650, { kind: 'columns', values: new Float32Array(40).fill(1) })
    expect(red(frames[0], 40, 20, 20)).toBe(255)
    expect(red(frames[0], 40, 20, 1)).toBe(Math.round(255 * 0.08))
  })

  it('keeps the round eyepiece field dark outside its circle', () => {
    const { ctx, frames } = canvas(40)
    createPatternRenderer().drawMonochrome(ctx, 'round', 650, { kind: 'radial', values: new Float32Array(19).fill(1) })
    expect(red(frames[0], 40, 20, 20)).toBe(255)
    expect(frames[0][3]).toBe(0)
  })

  it('normalizes white light to full brightness and serves repeats from the cache', () => {
    const renderer = createPatternRenderer()
    const profileAt = vi.fn(() => ({ kind: 'columns' as const, values: new Float32Array(30).fill(0.5) }))
    const first = canvas(30)
    renderer.drawWhiteLight(first.ctx, 'strip', { key: 'k', filterColor: 'none', step: 50, profileAt })
    const calls = profileAt.mock.calls.length
    expect(Math.max(...first.frames[0].filter((_, i) => i % 4 !== 3))).toBe(255)
    renderer.drawWhiteLight(canvas(30).ctx, 'strip', { key: 'k', filterColor: 'none', step: 50, profileAt })
    expect(profileAt).toHaveBeenCalledTimes(calls)
  })
})
