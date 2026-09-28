import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useLightDiffractionSceneState } from '../useLightDiffractionSceneState'

describe('light diffraction far-field screen distance', () => {
  it('keeps the shared model in its declared far-field range', () => {
    const { result } = renderHook(() => useLightDiffractionSceneState())

    act(() => result.current.setMode('circular-aperture'))
    act(() => result.current.setApertureSize(0.5))
    act(() => result.current.setWavelength(700))
    act(() => result.current.setScreenDistance(0.5))
    act(() => result.current.toggleWhiteLight())

    expect(result.current.minScreenDistance).toBeCloseTo(1.5625, 4)
    expect(result.current.screenDistance).toBeGreaterThanOrEqual(result.current.minScreenDistance)

    act(() => result.current.setScreenDistance(0.5))
    expect(result.current.screenDistance).toBeGreaterThanOrEqual(result.current.minScreenDistance)
  })
})
