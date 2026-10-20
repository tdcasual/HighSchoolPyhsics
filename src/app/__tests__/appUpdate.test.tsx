import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useAppUpdateReady } from '../offlineCache'

function installServiceWorker(controller: object | null) {
  const container = Object.assign(new EventTarget(), { controller })
  Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true })
  return container
}

describe('useAppUpdateReady', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker')
  })

  it('reports a new build taking over a tab that already had a service worker', () => {
    const container = installServiceWorker({})
    const { result } = renderHook(() => useAppUpdateReady())
    expect(result.current).toBe(false)
    act(() => {
      container.dispatchEvent(new Event('controllerchange'))
    })
    expect(result.current).toBe(true)
  })

  it('ignores the first install, which also claims the tab', () => {
    const container = installServiceWorker(null)
    const { result } = renderHook(() => useAppUpdateReady())
    act(() => {
      container.dispatchEvent(new Event('controllerchange'))
    })
    expect(result.current).toBe(false)
  })
})
