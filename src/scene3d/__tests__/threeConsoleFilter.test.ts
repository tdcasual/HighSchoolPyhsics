import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ThreeConsoleFilterEnvironment } from '../threeConsoleFilter'

type ThreeConsoleHandler = (type: string, message: string, ...params: unknown[]) => void

async function installFilter(environment: ThreeConsoleFilterEnvironment, originalConsole?: ThreeConsoleHandler) {
  vi.resetModules()

  const getConsoleFunction = vi.fn(() => originalConsole)
  const setConsoleFunction = vi.fn<(handler: ThreeConsoleHandler) => void>()
  vi.doMock('three', () => ({
    getConsoleFunction,
    setConsoleFunction,
  }))

  const module = await import('../threeConsoleFilter')
  module.installThreeConsoleFilter({ environment })

  const handler = setConsoleFunction.mock.calls[0]?.[0]
  expect(handler).toBeTypeOf('function')

  return {
    module,
    handler: handler as ThreeConsoleHandler,
    getConsoleFunction,
    setConsoleFunction,
  }
}

describe('threeConsoleFilter', () => {
  afterEach(() => {
    vi.doUnmock('three')
    vi.restoreAllMocks()
  })

  it('falls back to native console when Three console function is missing', async () => {
    const { handler } = await installFilter('test')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(() => handler('warn', 'test warning', 42)).not.toThrow()
    expect(warnSpy).toHaveBeenCalledWith('test warning', 42)
  })

  it('suppresses test-only warnings in test environment', async () => {
    const originalConsole = vi.fn<ThreeConsoleHandler>()
    const { handler } = await installFilter('test', originalConsole)

    handler('warn', 'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.')
    handler('warn', 'WARNING: Multiple instances of Three.js being imported.')

    expect(originalConsole).not.toHaveBeenCalled()
  })

  it('suppresses clock deprecation warnings in development environment', async () => {
    const originalConsole = vi.fn<ThreeConsoleHandler>()
    const { handler } = await installFilter('development', originalConsole)

    handler('warn', 'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.')

    expect(originalConsole).not.toHaveBeenCalled()
  })

  it('keeps deprecation warnings visible in production environment', async () => {
    const originalConsole = vi.fn<ThreeConsoleHandler>()
    const { handler } = await installFilter('production', originalConsole)

    handler('warn', 'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.')

    expect(originalConsole).toHaveBeenCalledWith(
      'warn',
      'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.',
    )
  })

  it('suppresses multi-instance warnings in production environment', async () => {
    const originalConsole = vi.fn<ThreeConsoleHandler>()
    const { handler } = await installFilter('production', originalConsole)

    handler('warn', 'WARNING: Multiple instances of Three.js being imported.')

    expect(originalConsole).not.toHaveBeenCalled()
  })

  it('falls back to the active runtime policy when the requested environment is malformed', async () => {
    const originalConsole = vi.fn<ThreeConsoleHandler>()
    const { handler } = await installFilter('staging' as unknown as ThreeConsoleFilterEnvironment, originalConsole)

    expect(() => handler('warn', 'ordinary warning')).not.toThrow()
    expect(originalConsole).toHaveBeenCalledWith('warn', 'ordinary warning')
  })
})
