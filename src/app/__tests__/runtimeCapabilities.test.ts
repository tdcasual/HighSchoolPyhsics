import { describe, expect, it } from 'vitest'
import { assessRuntimeSupport } from '../runtimeCapabilities'

describe('runtime capabilities', () => {
  it('marks runtime unsupported when Worker is missing', () => {
    const result = assessRuntimeSupport({
      hasWorker: false,
      hasPointerEvents: true,
      hasWebGL2: true,
      hasWebGL1: true,
    })

    expect(result.supported).toBe(false)
    expect(result.missing).toEqual(['Worker'])
  })

  it('allows WebGL1 when WebGL2 is unavailable', () => {
    const result = assessRuntimeSupport({
      hasWorker: true,
      hasPointerEvents: true,
      hasWebGL2: false,
      hasWebGL1: true,
    })

    expect(result.supported).toBe(true)
    expect(result.missing).toEqual([])
  })

  it('marks runtime unsupported when no WebGL context is available', () => {
    const result = assessRuntimeSupport({
      hasWorker: true,
      hasPointerEvents: true,
      hasWebGL2: false,
      hasWebGL1: false,
    })

    expect(result.supported).toBe(false)
    expect(result.missing).toEqual(['WebGL'])
  })

  it('marks runtime supported only when all required capabilities are present', () => {
    const result = assessRuntimeSupport({
      hasWorker: true,
      hasPointerEvents: true,
      hasWebGL2: true,
      hasWebGL1: true,
    })

    expect(result.supported).toBe(true)
    expect(result.missing).toEqual([])
  })
})
