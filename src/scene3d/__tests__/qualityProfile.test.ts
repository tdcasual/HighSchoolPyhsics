import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveCanvasQualityProfile } from '../canvasQuality'

const originalMatchMedia = window.matchMedia
const originalDeviceMemory = Object.getOwnPropertyDescriptor(window.navigator, 'deviceMemory')

function mockMatchMedia(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

function mockDeviceMemory(value: number): void {
  Object.defineProperty(window.navigator, 'deviceMemory', {
    configurable: true,
    value,
  })
}

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  })

  if (originalDeviceMemory) {
    Object.defineProperty(window.navigator, 'deviceMemory', originalDeviceMemory)
  } else {
    Reflect.deleteProperty(window.navigator, 'deviceMemory')
  }
})

describe('canvas quality profile', () => {
  it('uses high-quality profile for desktop-like environment', () => {
    mockMatchMedia(false)
    mockDeviceMemory(8)

    expect(resolveCanvasQualityProfile()).toEqual({
      dpr: [1, 1.75],
      antialias: true,
    })
  })

  it('uses low-power profile when device memory is constrained', () => {
    mockMatchMedia(false)
    mockDeviceMemory(2)

    expect(resolveCanvasQualityProfile()).toEqual({
      dpr: [1, 1.25],
      antialias: false,
    })
  })

  it('uses low-power profile for coarse pointer devices', () => {
    mockMatchMedia(true)
    mockDeviceMemory(8)

    expect(resolveCanvasQualityProfile()).toEqual({
      dpr: [1, 1.25],
      antialias: false,
    })
  })
})
