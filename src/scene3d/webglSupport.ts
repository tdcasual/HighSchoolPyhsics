type WebGLContextId = 'webgl2' | 'webgl'

type WebGLCanvasLike = {
  getContext: (contextId: WebGLContextId) => unknown
}

type WebGLSupportProbeInput = {
  hasWebGLRenderingContext: boolean
  createCanvas: () => WebGLCanvasLike
}

export function probeWebGLSupport({
  hasWebGLRenderingContext,
  createCanvas,
}: WebGLSupportProbeInput): boolean {
  if (!hasWebGLRenderingContext) {
    return false
  }

  try {
    const canvas = createCanvas()
    if (!canvas || typeof canvas.getContext !== 'function') {
      return false
    }

    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function isWebGLSupportedInBrowser(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  return probeWebGLSupport({
    hasWebGLRenderingContext: typeof window.WebGLRenderingContext !== 'undefined',
    createCanvas: () => {
      const canvas = document.createElement('canvas')
      return {
        getContext: (contextId: WebGLContextId) => canvas.getContext(contextId),
      }
    },
  })
}
