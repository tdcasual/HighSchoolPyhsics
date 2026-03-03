import { describe, expect, it } from 'vitest'
import { assessRuntimeSupport } from '../runtimeCapabilities'

describe('runtime capabilities', () => {
  it('marks runtime unsupported when Worker is missing', () => {
    const result = assessRuntimeSupport({
      hasWorker: false,
      hasPointerEvents: true,
      hasWebGL2: true,
    })

    expect(result.supported).toBe(false)
    expect(result.missing).toEqual(['Worker'])
  })

  it('marks runtime unsupported when WebGL2 is missing', () => {
    const result = assessRuntimeSupport({
      hasWorker: true,
      hasPointerEvents: true,
      hasWebGL2: false,
    })

    expect(result.supported).toBe(false)
    expect(result.missing).toEqual(['WebGL2'])
  })

  it('marks runtime supported only when all required capabilities are present', () => {
    const result = assessRuntimeSupport({
      hasWorker: true,
      hasPointerEvents: true,
      hasWebGL2: true,
    })

    expect(result.supported).toBe(true)
    expect(result.missing).toEqual([])
  })
})
