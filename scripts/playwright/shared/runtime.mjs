import { createServer } from 'node:net'
import {
  startViteDevServer,
  stopViteDevServer,
  waitForViteDevServer,
} from './devServer.mjs'

function normalizeBaseUrl(raw) {
  let parsed
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error(`Invalid BASE_URL: ${raw}`)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`BASE_URL must use http or https protocol: ${raw}`)
  }

  if (!parsed.port) {
    throw new Error(`BASE_URL must include explicit port: ${raw}`)
  }

  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`BASE_URL must target the site root without path/query/hash: ${raw}`)
  }

  return `${parsed.protocol}//${parsed.hostname}:${parsed.port}`
}

async function defaultIsPortAvailable({ host, port }) {
  return await new Promise((resolve) => {
    const server = createServer()

    const cleanup = () => {
      server.removeAllListeners('error')
      server.removeAllListeners('listening')
    }

    server.unref()
    server.once('error', () => {
      cleanup()
      resolve(false)
    })
    server.once('listening', () => {
      server.close((error) => {
        cleanup()
        resolve(!error)
      })
    })
    server.listen({ host, port, exclusive: true })
  })
}

export function resolvePlaywrightRuntime({ defaultBaseUrl, env = process.env }) {
  const rawBaseUrl = env.BASE_URL?.trim() || defaultBaseUrl
  const baseUrl = normalizeBaseUrl(rawBaseUrl)
  const devPort = new URL(baseUrl).port
  return { baseUrl, devPort }
}

export async function resolveManagedPlaywrightRuntime({
  defaultBaseUrl,
  env = process.env,
  isPortAvailable = defaultIsPortAvailable,
  maxPortOffset = 20,
}) {
  if (env.BASE_URL?.trim()) {
    return resolvePlaywrightRuntime({ defaultBaseUrl, env })
  }

  const baseUrl = normalizeBaseUrl(defaultBaseUrl)
  const parsed = new URL(baseUrl)
  const startPort = Number(parsed.port)

  for (let offset = 0; offset <= maxPortOffset; offset += 1) {
    const candidatePort = startPort + offset
    if (await isPortAvailable({ host: parsed.hostname, port: candidatePort })) {
      return {
        baseUrl: `${parsed.protocol}//${parsed.hostname}:${candidatePort}`,
        devPort: String(candidatePort),
      }
    }
  }

  throw new Error(
    `Unable to find available port in range ${startPort}-${startPort + maxPortOffset} for ${parsed.hostname}`,
  )
}

export async function runWithManagedViteServer(options, run) {
  const {
    rootDir,
    baseUrl,
    devPort,
    logPath,
    host = '127.0.0.1',
    startServer = startViteDevServer,
    waitForServer = waitForViteDevServer,
    stopServer = stopViteDevServer,
  } = options

  const server = startServer({
    rootDir,
    port: devPort,
    logPath,
    host,
  })

  try {
    await waitForServer(baseUrl, server)
    return await run(server)
  } finally {
    await stopServer(server)
  }
}
