import { describe, expect, it } from 'vitest'
import { probeWebGLSupport } from '../webglSupport'

describe('webglSupport', () => {
  it('returns false when WebGLRenderingContext is missing', () => {
    const supported = probeWebGLSupport({
      hasWebGLRenderingContext: false,
      createCanvas: () => ({
        getContext: () => ({}),
      }),
    })
    expect(supported).toBe(false)
  })

  it('returns false when context creation throws', () => {
    const supported = probeWebGLSupport({
      hasWebGLRenderingContext: true,
      createCanvas: () => ({
        getContext: () => {
          throw new Error('context creation failed')
        },
      }),
    })
    expect(supported).toBe(false)
  })

  it('returns false when no webgl contexts are available', () => {
    const supported = probeWebGLSupport({
      hasWebGLRenderingContext: true,
      createCanvas: () => ({
        getContext: () => null,
      }),
    })
    expect(supported).toBe(false)
  })

  it('returns true when webgl2 context can be created', () => {
    const supported = probeWebGLSupport({
      hasWebGLRenderingContext: true,
      createCanvas: () => ({
        getContext: (contextId: 'webgl2' | 'webgl') => (contextId === 'webgl2' ? {} : null),
      }),
    })
    expect(supported).toBe(true)
  })
})
