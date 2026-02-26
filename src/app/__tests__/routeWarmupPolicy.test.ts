import { afterEach, describe, expect, it, vi } from 'vitest'
import { shouldWarmRouteOnOverview } from '../routeWarmupPolicy'

const originalMatchMedia = window.matchMedia
const originalConnection = Object.getOwnPropertyDescriptor(window.navigator, 'connection')

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

function mockConnection(value: { saveData?: boolean; effectiveType?: string } | undefined): void {
  Object.defineProperty(window.navigator, 'connection', {
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

  if (originalConnection) {
    Object.defineProperty(window.navigator, 'connection', originalConnection)
  } else {
    Reflect.deleteProperty(window.navigator, 'connection')
  }
})

describe('route warmup policy', () => {
  it('allows route warmup for fine pointer and normal network', () => {
    mockMatchMedia(true)
    mockConnection({ saveData: false, effectiveType: '4g' })

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

  it('disables route warmup for coarse pointer devices', () => {
    mockMatchMedia(false)
    mockConnection({ saveData: false, effectiveType: '4g' })

    expect(shouldWarmRouteOnOverview()).toBe(false)
  })
})
