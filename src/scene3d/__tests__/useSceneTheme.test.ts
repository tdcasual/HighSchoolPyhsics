import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../store/useAppStore'
import { useSceneTheme } from '../useSceneTheme'

describe('useSceneTheme', () => {
  afterEach(() => useAppStore.setState({ theme: 'day' }))

  it('picks the day or night value as the theme changes', () => {
    useAppStore.setState({ theme: 'day' })
    const { result } = renderHook(() => useSceneTheme())
    expect(result.current.night).toBe(false)
    expect(result.current.pick('#fff', '#000')).toBe('#fff')
    act(() => useAppStore.setState({ theme: 'night' }))
    expect(result.current.night).toBe(true)
    expect(result.current.pick('#fff', '#000')).toBe('#000')
  })
})
