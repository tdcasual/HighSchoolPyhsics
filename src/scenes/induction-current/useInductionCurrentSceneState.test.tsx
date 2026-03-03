import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useInductionCurrentSceneState } from './useInductionCurrentSceneState'

describe('useInductionCurrentSceneState', () => {
  it('keeps appending experiment records before reset', async () => {
    const { result } = renderHook(() => useInductionCurrentSceneState())

    expect(result.current.records).toHaveLength(0)
    expect(result.current.canMoveTowardsCoil).toBe(true)
    expect(result.current.canMoveAwayFromCoil).toBe(false)

    act(() => {
      result.current.moveTowardsCoil()
    })

    expect(result.current.canChangePolarity).toBe(false)
    await waitFor(() => expect(result.current.records).toHaveLength(1))
    await waitFor(() => expect(result.current.canChangePolarity).toBe(true))
    expect(result.current.records[0].fluxChange).toBe('increase')

    await waitFor(() => expect(result.current.canMoveAwayFromCoil).toBe(true))

    act(() => {
      result.current.moveAwayFromCoil()
    })

    await waitFor(() => expect(result.current.records).toHaveLength(2))
    expect(result.current.records[1].fluxChange).toBe('decrease')

    act(() => {
      result.current.resetExperiment()
    })

    expect(result.current.records).toHaveLength(0)
    expect(result.current.canMoveTowardsCoil).toBe(true)
    expect(result.current.canMoveAwayFromCoil).toBe(false)
  })

  it('applies polarity setting to the latest induction outcome', async () => {
    const { result } = renderHook(() => useInductionCurrentSceneState())

    act(() => {
      result.current.setPoleSetting('s-top-n-down')
      result.current.moveTowardsCoil()
    })

    await waitFor(() => expect(result.current.lastOutcome).not.toBeNull())
    expect(result.current.lastOutcome?.originalFieldDirection).toBe('down')
    expect(result.current.lastOutcome?.inducedCurrentDirection).toBe('counterclockwise')
  })
})
