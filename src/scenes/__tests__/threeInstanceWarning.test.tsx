import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

function hasMultipleThreeWarning(calls: unknown[][]): boolean {
  return calls.some((args) => args.some((arg) => String(arg).includes('Multiple instances of Three.js')))
}

describe('three singleton import', () => {
  it('does not log multiple Three.js instance warning when rendering a scene', async () => {
    vi.resetModules()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { MhdGeneratorScene } = await import('../mhd/MhdGeneratorScene')

    render(<MhdGeneratorScene />)
    expect(await screen.findByText('磁流体发电机控制')).toBeInTheDocument()

    expect(hasMultipleThreeWarning(warnSpy.mock.calls)).toBe(false)
    expect(hasMultipleThreeWarning(errorSpy.mock.calls)).toBe(false)

    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
