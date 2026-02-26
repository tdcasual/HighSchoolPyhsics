/// <reference types="node" />

import { describe, expect, it, vi } from 'vitest'

function hasLocalStorageFileWarning(calls: unknown[][]): boolean {
  return calls.some((args) => args.some((arg) => String(arg).includes('--localstorage-file')))
}

describe('app store storage environment', () => {
  it('does not emit node localstorage-file warning when loading app store in test runtime', async () => {
    vi.resetModules()

    const emitWarningSpy = vi.spyOn(process, 'emitWarning')
    await import('../useAppStore')

    expect(hasLocalStorageFileWarning(emitWarningSpy.mock.calls)).toBe(false)
    emitWarningSpy.mockRestore()
  })
})
