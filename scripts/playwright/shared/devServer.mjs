import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'

export function createViteDevServerCommand({ host, port }) {
  return ['run', 'dev', '--', '--host', host, '--port', String(port), '--strictPort']
}

export function startViteDevServer({
  rootDir,
  port,
  logPath,
  host = '127.0.0.1',
}, runtime = {}) {
  const spawnImpl = runtime.spawnImpl ?? spawn
  const createWriteStreamImpl = runtime.createWriteStreamImpl ?? createWriteStream
  const env = runtime.env ?? process.env
  const child = spawnImpl('npm', createViteDevServerCommand({ host, port }), {
    cwd: rootDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const logStream = createWriteStreamImpl(logPath, { flags: 'w' })
  if (typeof child.stdout?.pipe === 'function') {
    child.stdout.pipe(logStream)
  }
  if (typeof child.stderr?.pipe === 'function') {
    child.stderr.pipe(logStream)
  }

  return { child, logStream, logPath }
}

async function hasServerReadyLog(logPath, url) {
  try {
    const content = await readFile(logPath, 'utf8')
    const normalized = url.replace(/\/+$/, '')
    return content.includes(normalized)
  } catch {
    return false
  }
}

function createServerStartupError(url, server) {
  const signalSuffix = server.child.signalCode ? `, signal ${server.child.signalCode}` : ''
  const exitCode = server.child.exitCode ?? 'unknown'
  return new Error(
    `Vite dev server exited before ready (code ${exitCode}${signalSuffix}). Expected: ${url}. See log: ${server.logPath}`,
  )
}

export async function waitForViteDevServer(
  url,
  server,
  options = {},
) {
  const maxAttempts = options.maxAttempts ?? 80
  const attemptDelayMs = options.attemptDelayMs ?? 300
  const fingerprint = options.fingerprint ?? '<div id="root"></div>'
  const settleDelayMs = options.settleDelayMs ?? 120
  const fetchImpl = options.fetchImpl ?? fetch
  const delayFn = options.delayFn ?? delay
  const readinessLogCheck = options.readinessLogCheck ?? hasServerReadyLog

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (server.child.exitCode !== null) {
      throw createServerStartupError(url, server)
    }

    try {
      const response = await fetchImpl(url)
      if (response.ok) {
        const html = await response.text()
        if (!html.includes(fingerprint)) {
          await delayFn(settleDelayMs)
          continue
        }
        const hasReadyLog = await readinessLogCheck(server.logPath, url)
        if (!hasReadyLog) {
          await delayFn(settleDelayMs)
          continue
        }
        if (server.child.exitCode !== null) {
          throw createServerStartupError(url, server)
        }
        return
      }
    } catch {
      // ignore until timeout
    }
    await delayFn(attemptDelayMs)
  }

  throw new Error(`Vite dev server did not become ready: ${url}. See log: ${server.logPath}`)
}

export async function stopViteDevServer(server, options = {}) {
  if (!server) {
    return
  }

  const gracePeriodMs = options.gracePeriodMs ?? 3000
  const delayFn = options.delayFn ?? delay
  const { child, logStream } = server

  if (child.exitCode === null) {
    child.kill('SIGTERM')
    await Promise.race([
      new Promise((resolve) => child.once('exit', resolve)),
      delayFn(gracePeriodMs),
    ])
    if (child.exitCode === null) {
      child.kill('SIGKILL')
    }
  }

  if (typeof logStream?.end === 'function') {
    logStream.end()
  }
}
