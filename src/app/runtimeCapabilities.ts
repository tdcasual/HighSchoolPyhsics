type RuntimeCapabilityProbe = {
  hasWorker: boolean
  hasPointerEvents: boolean
  hasWebGL2: boolean
  hasWebGL1: boolean
}

export type RuntimeCapabilities = RuntimeCapabilityProbe & {
  supported: boolean
  missing: string[]
}

function isTestRuntime(): boolean {
  const viteEnv = (import.meta as { env?: Record<string, unknown> }).env
  return Boolean(viteEnv && (viteEnv.MODE === 'test' || viteEnv.VITEST === true))
}

function loseGlContext(gl: RenderingContext | null): void {
  if (!gl || !('getExtension' in gl)) {
    return
  }

  const lose = (gl as WebGLRenderingContext).getExtension?.('WEBGL_lose_context')
  lose?.loseContext()
}

function probeGlContext(contextIds: string[]): boolean {
  if (typeof document === 'undefined') {
    return false
  }

  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    for (const contextId of contextIds) {
      const gl = canvas.getContext(contextId, { failIfMajorPerformanceCaveat: false })
      if (gl) {
        loseGlContext(gl)
        return true
      }
    }
    return false
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
      hasWebGL1: true,
    }
  }

  return {
    hasWorker: typeof Worker !== 'undefined',
    hasPointerEvents: typeof PointerEvent !== 'undefined',
    hasWebGL2: probeGlContext(['webgl2']),
    hasWebGL1: probeGlContext(['webgl', 'experimental-webgl']),
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
  if (!probe.hasWebGL2 && !probe.hasWebGL1) {
    missing.push('WebGL')
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
