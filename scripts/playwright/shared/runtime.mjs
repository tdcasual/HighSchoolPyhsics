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

export function resolvePlaywrightRuntime({ defaultBaseUrl, env = process.env }) {
  const rawBaseUrl = env.BASE_URL?.trim() || defaultBaseUrl
  const baseUrl = normalizeBaseUrl(rawBaseUrl)
  const devPort = new URL(baseUrl).port
  return { baseUrl, devPort }
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
