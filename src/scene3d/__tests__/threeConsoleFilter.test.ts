import { describe, expect, it, vi } from 'vitest'

type ThreeConsoleHandler = (type: string, message: string, ...params: unknown[]) => void

describe('threeConsoleFilter', () => {
  it('falls back to native console when Three console function is missing', async () => {
    vi.resetModules()

    const getConsoleFunction = vi.fn(() => undefined)
    const setConsoleFunction = vi.fn<(handler: ThreeConsoleHandler) => void>()
    vi.doMock('three', () => ({
      getConsoleFunction,
      setConsoleFunction,
    }))

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { installThreeConsoleFilter } = await import('../threeConsoleFilter')

    installThreeConsoleFilter()
    const handler = setConsoleFunction.mock.calls[0]?.[0]
    expect(handler).toBeTypeOf('function')

    expect(() => handler?.('warn', 'test warning', 42)).not.toThrow()
    expect(warnSpy).toHaveBeenCalledWith('test warning', 42)

    warnSpy.mockRestore()
    vi.doUnmock('three')
  })
})
