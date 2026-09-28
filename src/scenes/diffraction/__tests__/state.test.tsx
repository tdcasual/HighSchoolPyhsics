import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDiffractionSceneState } from '../useDiffractionSceneState'

describe('diffraction far-field screen distance', () => {
  it('raises the screen distance when aperture or white-light range requires it', () => {
    const { result } = renderHook(() => useDiffractionSceneState())

    act(() => {
      result.current.setApertureSize(0.3)
      result.current.setWavelength(400)
    })
    expect(result.current.minScreenDistance).toBeCloseTo(0.5625, 4)
    expect(result.current.params.screenDistance).toBeGreaterThanOrEqual(result.current.minScreenDistance)

    act(() => result.current.setMode('circular-aperture'))
    act(() => result.current.setApertureSize(0.5))
    act(() => {
      result.current.setWavelength(700)
      result.current.setScreenDistance(0.5)
    })
    expect(result.current.params.screenDistance).toBeCloseTo(0.892857, 5)

    act(() => result.current.toggleWhiteLight())
    expect(result.current.minScreenDistance).toBeCloseTo(1.5625, 4)
    expect(result.current.params.screenDistance).toBeGreaterThanOrEqual(result.current.minScreenDistance)
  })
})
