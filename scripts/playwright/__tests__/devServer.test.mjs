import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createViteDevServerCommand,
  startViteDevServer,
  stopViteDevServer,
  waitForViteDevServer,
} from '../shared/devServer.mjs'

function createMockChildProcess() {
  const child = new EventEmitter()
  child.stdout = new PassThrough()
  child.stderr = new PassThrough()
  child.exitCode = null
  child.signalCode = null
  child.kill = vi.fn((signal) => {
    if (signal === 'SIGKILL') {
      child.exitCode = 137
      child.signalCode = 'SIGKILL'
      child.emit('exit', 137, 'SIGKILL')
    }
  })
  return child
}

describe('playwright dev server shared runtime', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds strict Vite dev command from host and port', () => {
    expect(createViteDevServerCommand({ host: '0.0.0.0', port: 4210 })).toEqual([
      'run',
      'dev',
      '--',
      '--host',
      '0.0.0.0',
      '--port',
      '4210',
      '--strictPort',
    ])
  })

  it('uses injected spawn and stream factories for server startup', () => {
    const child = createMockChildProcess()
    const spawnImpl = vi.fn(() => child)
    const logStream = new PassThrough()
    const createWriteStreamImpl = vi.fn(() => logStream)

    const server = startViteDevServer(
      {
        rootDir: '/tmp/demo',
        port: 4301,
        logPath: '/tmp/demo/vite.log',
      },
      {
        env: { NODE_ENV: 'test' },
        spawnImpl,
        createWriteStreamImpl,
      },
    )

    expect(spawnImpl).toHaveBeenCalledWith(
      'npm',
      ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4301', '--strictPort'],
      {
        cwd: '/tmp/demo',
        env: { NODE_ENV: 'test' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    expect(server.child).toBe(child)
    expect(server.logStream).toBe(logStream)
    expect(server.logPath).toBe('/tmp/demo/vite.log')
  })

  it('uses injected readiness probes while waiting for server', async () => {
    const server = {
      child: { exitCode: null, signalCode: null },
      logPath: '/tmp/unused.log',
    }

    const fetchImpl = vi.fn(async () => ({
      ok: true,
      text: async () => '<html><body><div id="root"></div></body></html>',
    }))
    const readinessLogCheck = vi.fn(async () => true)
    const delayFn = vi.fn(async () => undefined)

    await expect(
      waitForViteDevServer('http://127.0.0.1:9', server, {
        maxAttempts: 1,
        attemptDelayMs: 0,
        fetchImpl,
        readinessLogCheck,
        delayFn,
      }),
    ).resolves.toBeUndefined()

    expect(fetchImpl).toHaveBeenCalledWith('http://127.0.0.1:9')
    expect(readinessLogCheck).toHaveBeenCalledWith('/tmp/unused.log', 'http://127.0.0.1:9')
  })

  it('times out with helpful log path when readiness checks never pass', async () => {
    const server = {
      child: { exitCode: null, signalCode: null },
      logPath: '/tmp/not-ready.log',
    }

    const fetchImpl = vi.fn(async () => ({ ok: false, text: async () => '' }))

    await expect(
      waitForViteDevServer('http://127.0.0.1:9', server, {
        maxAttempts: 2,
        attemptDelayMs: 0,
        fetchImpl,
        delayFn: async () => undefined,
      }),
    ).rejects.toThrow(/did not become ready: http:\/\/127.0.0.1:9\. See log: \/tmp\/not-ready\.log/)
  })

  it('forces SIGKILL after configurable grace period when process does not exit', async () => {
    const child = createMockChildProcess()
    const logStream = { end: vi.fn() }

    await stopViteDevServer(
      {
        child,
        logStream,
        logPath: '/tmp/mock.log',
      },
      {
        gracePeriodMs: 0,
        delayFn: async () => undefined,
      },
    )

    expect(child.kill).toHaveBeenNthCalledWith(1, 'SIGTERM')
    expect(child.kill).toHaveBeenNthCalledWith(2, 'SIGKILL')
    expect(logStream.end).toHaveBeenCalledTimes(1)
  }, 300)
})
