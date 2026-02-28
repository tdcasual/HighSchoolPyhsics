import { describe, expect, it, vi } from 'vitest'
import {
  resolvePlaywrightRuntime,
  runWithManagedViteServer,
} from '../shared/runtime.mjs'

describe('playwright runtime resolution', () => {
  it('uses default BASE_URL and extracts explicit port', () => {
    const runtime = resolvePlaywrightRuntime({
      defaultBaseUrl: 'http://127.0.0.1:4174',
      env: {},
    })

    expect(runtime).toEqual({
      baseUrl: 'http://127.0.0.1:4174',
      devPort: '4174',
    })
  })

  it('normalizes trailing slash from BASE_URL env override', () => {
    const runtime = resolvePlaywrightRuntime({
      defaultBaseUrl: 'http://127.0.0.1:4174',
      env: { BASE_URL: 'http://127.0.0.1:4199/' },
    })

    expect(runtime.baseUrl).toBe('http://127.0.0.1:4199')
    expect(runtime.devPort).toBe('4199')
  })

  it('rejects non-http url protocol', () => {
    expect(() =>
      resolvePlaywrightRuntime({
        defaultBaseUrl: 'http://127.0.0.1:4174',
        env: { BASE_URL: 'file:///tmp/demo' },
      }),
    ).toThrow(/must use http or https/)
  })

  it('rejects BASE_URL without explicit port', () => {
    expect(() =>
      resolvePlaywrightRuntime({
        defaultBaseUrl: 'http://127.0.0.1:4174',
        env: { BASE_URL: 'http://127.0.0.1' },
      }),
    ).toThrow(/must include explicit port/)
  })

  it('rejects BASE_URL with pathname/query/hash', () => {
    expect(() =>
      resolvePlaywrightRuntime({
        defaultBaseUrl: 'http://127.0.0.1:4174',
        env: { BASE_URL: 'http://127.0.0.1:4174/demo?x=1' },
      }),
    ).toThrow(/must target the site root/)
  })
})

describe('managed vite server lifecycle', () => {
  it('starts, waits, runs callback, and always stops', async () => {
    const server = { id: 'mock-server' }
    const startServer = vi.fn(() => server)
    const waitForServer = vi.fn(async () => undefined)
    const stopServer = vi.fn(async () => undefined)
    const callback = vi.fn(async () => 'done')

    await expect(
      runWithManagedViteServer(
        {
          rootDir: '/tmp/project',
          baseUrl: 'http://127.0.0.1:4174',
          devPort: '4174',
          logPath: '/tmp/project/vite.log',
          startServer,
          waitForServer,
          stopServer,
        },
        callback,
      ),
    ).resolves.toBe('done')

    expect(startServer).toHaveBeenCalledWith({
      rootDir: '/tmp/project',
      port: '4174',
      logPath: '/tmp/project/vite.log',
      host: '127.0.0.1',
    })
    expect(waitForServer).toHaveBeenCalledWith('http://127.0.0.1:4174', server)
    expect(callback).toHaveBeenCalledWith(server)
    expect(stopServer).toHaveBeenCalledWith(server)
  })

  it('stops server when callback throws and rethrows', async () => {
    const server = { id: 'mock-server' }
    const startServer = vi.fn(() => server)
    const waitForServer = vi.fn(async () => undefined)
    const stopServer = vi.fn(async () => undefined)

    await expect(
      runWithManagedViteServer(
        {
          rootDir: '/tmp/project',
          baseUrl: 'http://127.0.0.1:4174',
          devPort: '4174',
          logPath: '/tmp/project/vite.log',
          startServer,
          waitForServer,
          stopServer,
        },
        async () => {
          throw new Error('boom')
        },
      ),
    ).rejects.toThrow('boom')

    expect(stopServer).toHaveBeenCalledWith(server)
  })
})
