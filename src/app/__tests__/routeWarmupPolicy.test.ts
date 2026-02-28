import { afterEach, describe, expect, it, vi } from 'vitest'
import { shouldWarmRouteOnOverview } from '../routeWarmupPolicy'

const originalMatchMedia = window.matchMedia
const originalConnection = Object.getOwnPropertyDescriptor(window.navigator, 'connection')
const originalDeviceMemory = Object.getOwnPropertyDescriptor(window.navigator, 'deviceMemory')
const originalHardwareConcurrency = Object.getOwnPropertyDescriptor(window.navigator, 'hardwareConcurrency')

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

function mockConnection(
  value: { saveData?: boolean; effectiveType?: string; downlink?: number; rtt?: number } | undefined,
): void {
  Object.defineProperty(window.navigator, 'connection', {
    configurable: true,
    value,
  })
}

function mockDeviceProfile({
  deviceMemory,
  hardwareConcurrency,
}: {
  deviceMemory?: number
  hardwareConcurrency?: number
}): void {
  if (typeof deviceMemory === 'number') {
    Object.defineProperty(window.navigator, 'deviceMemory', {
      configurable: true,
      value: deviceMemory,
    })
  }

  if (typeof hardwareConcurrency === 'number') {
    Object.defineProperty(window.navigator, 'hardwareConcurrency', {
      configurable: true,
      value: hardwareConcurrency,
    })
  }
}

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  })

  if (originalConnection) {
    Object.defineProperty(window.navigator, 'connection', originalConnection)
  } else {
    Reflect.deleteProperty(window.navigator, 'connection')
  }

  if (originalDeviceMemory) {
    Object.defineProperty(window.navigator, 'deviceMemory', originalDeviceMemory)
  } else {
    Reflect.deleteProperty(window.navigator, 'deviceMemory')
  }

  if (originalHardwareConcurrency) {
    Object.defineProperty(window.navigator, 'hardwareConcurrency', originalHardwareConcurrency)
  } else {
    Reflect.deleteProperty(window.navigator, 'hardwareConcurrency')
  }
})

describe('route warmup policy', () => {
  it('allows route warmup for fine pointer and normal network', () => {
    mockMatchMedia(true)
    mockConnection({ saveData: false, effectiveType: '4g' })
    mockDeviceProfile({ deviceMemory: 8, hardwareConcurrency: 8 })

    expect(shouldWarmRouteOnOverview()).toBe(true)
  })

  it('disables route warmup when data saver is enabled', () => {
    mockMatchMedia(true)
    mockConnection({ saveData: true, effectiveType: '4g' })

    expect(shouldWarmRouteOnOverview()).toBe(false)
  })

  it('disables route warmup on slow network types', () => {
    mockMatchMedia(true)
    mockConnection({ saveData: false, effectiveType: '2g' })

    expect(shouldWarmRouteOnOverview()).toBe(false)
  })

  it('disables route warmup on 3g network type', () => {
    mockMatchMedia(true)
    mockConnection({ saveData: false, effectiveType: '3g' })

    expect(shouldWarmRouteOnOverview()).toBe(false)
  })

  it('disables route warmup when downlink bandwidth is low', () => {
    mockMatchMedia(true)
    mockConnection({ saveData: false, effectiveType: '4g', downlink: 0.8 })
    mockDeviceProfile({ deviceMemory: 8, hardwareConcurrency: 8 })

    expect(shouldWarmRouteOnOverview()).toBe(false)
  })

  it('disables route warmup when network latency is high', () => {
    mockMatchMedia(true)
    mockConnection({ saveData: false, effectiveType: '4g', rtt: 450 })
    mockDeviceProfile({ deviceMemory: 8, hardwareConcurrency: 8 })

    expect(shouldWarmRouteOnOverview()).toBe(false)
  })

  it('disables route warmup for coarse pointer devices', () => {
    mockMatchMedia(false)
    mockConnection({ saveData: false, effectiveType: '4g' })
    mockDeviceProfile({ deviceMemory: 8, hardwareConcurrency: 8 })

    expect(shouldWarmRouteOnOverview()).toBe(false)
  })

  it('disables route warmup for low-memory devices', () => {
    mockMatchMedia(true)
    mockConnection({ saveData: false, effectiveType: '4g' })
    mockDeviceProfile({ deviceMemory: 2, hardwareConcurrency: 8 })

    expect(shouldWarmRouteOnOverview()).toBe(false)
  })

  it('disables route warmup for low-core devices', () => {
    mockMatchMedia(true)
    mockConnection({ saveData: false, effectiveType: '4g' })
    mockDeviceProfile({ deviceMemory: 8, hardwareConcurrency: 2 })

    expect(shouldWarmRouteOnOverview()).toBe(false)
  })
})
