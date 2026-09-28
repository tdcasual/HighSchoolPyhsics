import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useParticleSimulation } from '../../core/useParticleSimulation'
import { useOscilloscopeSimulation } from './useOscilloscopeSimulation'

vi.mock('../../core/useParticleSimulation', () => ({
  useParticleSimulation: vi.fn((options: unknown) => options as never),
}))

beforeEach(() => {
  vi.mocked(useParticleSimulation).mockClear()
})

describe('oscilloscope playback rate', () => {
  it('changes the simulation step without replacing initial state or requesting a reset', () => {
    const { rerender } = renderHook(
      ({ rate }: { rate: number }) => useOscilloscopeSimulation(1 / 240, rate),
      { initialProps: { rate: 1 } },
    )
    const mockedSimulation = vi.mocked(useParticleSimulation)
    const initialOptions = mockedSimulation.mock.calls[0][0]

    expect(initialOptions.dt).toBeCloseTo(1 / 240)
    expect(initialOptions.autoResetOnInitialStateChange).toBeUndefined()

    rerender({ rate: 2 })
    const updatedOptions = mockedSimulation.mock.calls[1][0]

    expect(updatedOptions.dt).toBeCloseTo(2 / 240)
    expect(updatedOptions.initialState).toBe(initialOptions.initialState)
    expect(updatedOptions.autoResetOnInitialStateChange).toBeUndefined()
  })

  it('bounds invalid or excessive playback rates', () => {
    const { rerender } = renderHook(
      ({ rate }: { rate: number }) => useOscilloscopeSimulation(1 / 240, rate),
      { initialProps: { rate: 99 } },
    )
    const mockedSimulation = vi.mocked(useParticleSimulation)

    expect(mockedSimulation.mock.calls[0][0].dt).toBeCloseTo(3 / 240)
    rerender({ rate: Number.NaN })
    expect(mockedSimulation.mock.calls[1][0].dt).toBeCloseTo(1 / 240)
  })
})
