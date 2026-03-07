import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  resolvePresentationStrategy,
  usePresentationStrategy,
} from '../usePresentationStrategy'

describe('usePresentationStrategy', () => {
  it('prefers explicit route override over auto score', () => {
    expect(resolvePresentationStrategy('viewport', 10)).toBe('viewport')
    expect(resolvePresentationStrategy('split', 0)).toBe('split')
    expect(resolvePresentationStrategy('auto', 2)).toBe('split')
    expect(resolvePresentationStrategy('auto', 1)).toBe('viewport')
  })

  it('collects runtime presentation signals from control nodes', async () => {
    window.history.replaceState(null, '', '/strategy-test')
    const controlsHost = document.createElement('aside')
    controlsHost.innerHTML = '<div data-presentation-signal="chart live-metric"></div>'
    const controlsRef = { current: controlsHost }
    const viewportRef = { current: null }

    const { result } = renderHook(() =>
      usePresentationStrategy({
        presentationSignals: [],
        controls: <div />,
        controlsRef,
        viewportRef,
        activeScenePath: '/strategy-test',
        presentationRouteModes: {},
      }),
    )

    await waitFor(() => {
      expect(result.current.autoSignalScore).toBeGreaterThanOrEqual(2)
      expect(result.current.presentationStrategy).toBe('split')
    })
  })


  it('collects runtime presentation signals from viewport nodes', async () => {
    window.history.replaceState(null, '', '/strategy-test')
    const controlsRef = { current: null }
    const viewportHost = document.createElement('section')
    viewportHost.innerHTML = '<div data-presentation-signal="chart live-metric"></div>'
    const viewportRef = { current: viewportHost }

    const { result } = renderHook(() =>
      usePresentationStrategy({
        presentationSignals: [],
        controls: <div />,
        controlsRef,
        viewportRef,
        activeScenePath: '/strategy-test',
        presentationRouteModes: {},
      }),
    )

    await waitFor(() => {
      expect(result.current.autoSignalScore).toBeGreaterThanOrEqual(2)
      expect(result.current.presentationStrategy).toBe('split')
    })
  })


  it('uses sceneKind fallback to keep trajectory scenes in split when explicit signals are sparse', async () => {
    window.history.replaceState(null, '', '/cyclotron')
    const controlsRef = { current: null }
    const viewportRef = { current: null }

    const { result } = renderHook(() =>
      usePresentationStrategy({
        presentationSignals: [],
        controls: <div />,
        controlsRef,
        viewportRef,
        activeScenePath: '/cyclotron',
        presentationRouteModes: {},
      }),
    )

    await waitFor(() => {
      expect(result.current.autoSignalScore).toBeGreaterThanOrEqual(2)
      expect(result.current.presentationStrategy).toBe('split')
    })
  })

  it('uses sceneKind fallback to keep structure scenes in viewport when explicit signals are sparse', async () => {
    window.history.replaceState(null, '', '/oersted')
    const controlsRef = { current: null }
    const viewportRef = { current: null }

    const { result } = renderHook(() =>
      usePresentationStrategy({
        presentationSignals: [],
        controls: <div />,
        controlsRef,
        viewportRef,
        activeScenePath: '/oersted',
        presentationRouteModes: {},
      }),
    )

    await waitFor(() => {
      expect(result.current.autoSignalScore).toBe(1)
      expect(result.current.presentationStrategy).toBe('viewport')
    })
  })
})
