import { describe, expect, it, vi } from 'vitest'
import { safePreload } from '../safePreload'

describe('safePreload', () => {
  it('invokes preload callback', async () => {
    const preload = vi.fn(async () => undefined)

    safePreload(preload)
    await Promise.resolve()

    expect(preload).toHaveBeenCalledTimes(1)
  })

  it('swallows preload rejection', async () => {
    const preload = vi.fn(async () => {
      throw new Error('warmup failed')
    })

    expect(() => safePreload(preload)).not.toThrow()
    await Promise.resolve()

    expect(preload).toHaveBeenCalledTimes(1)
  })
})
