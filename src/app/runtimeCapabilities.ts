type RuntimeCapabilityProbe = {
  hasWorker: boolean
  hasPointerEvents: boolean
  hasWebGL2: boolean
}

export type RuntimeCapabilities = RuntimeCapabilityProbe & {
  supported: boolean
  missing: string[]
}

function isTestRuntime(): boolean {
  const viteEnv = (import.meta as { env?: Record<string, unknown> }).env
  return Boolean(viteEnv && (viteEnv.MODE === 'test' || viteEnv.VITEST === true))
}

function probeWebGL2Support(): boolean {
  if (typeof document === 'undefined') {
    return false
  }

  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

function probeRuntimeCapabilities(): RuntimeCapabilityProbe {
  if (isTestRuntime()) {
    return {
      hasWorker: true,
      hasPointerEvents: true,
      hasWebGL2: true,
    }
  }

  return {
    hasWorker: typeof Worker !== 'undefined',
    hasPointerEvents: typeof PointerEvent !== 'undefined',
    hasWebGL2: probeWebGL2Support(),
  }
}

export function assessRuntimeSupport(probe: RuntimeCapabilityProbe): RuntimeCapabilities {
  const missing: string[] = []

  if (!probe.hasWorker) {
    missing.push('Worker')
  }
  if (!probe.hasPointerEvents) {
    missing.push('Pointer Events')
  }
  if (!probe.hasWebGL2) {
    missing.push('WebGL2')
  }

  return {
    ...probe,
    supported: missing.length === 0,
    missing,
  }
}

export function getRuntimeCapabilities(): RuntimeCapabilities {
  return assessRuntimeSupport(probeRuntimeCapabilities())
}
