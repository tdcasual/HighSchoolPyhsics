import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NavigationPage } from '../NavigationPage'
import type { DemoRoute } from '../../app/demoRoutes'
import { shouldWarmRouteOnOverview } from '../../app/routeWarmupPolicy'
import sceneCatalog from '../../../config/demo-scenes.json'
import { PHYSICS_REGIONS } from '../../ui/navigation/regionData'
import { NAVIGATION_VIEWS, findNavigationView } from '../../ui/navigation/navigationViews'

vi.mock('../../app/routeWarmupPolicy', () => ({
  shouldWarmRouteOnOverview: vi.fn(() => true),
}))

const mockedShouldWarmRouteOnOverview = vi.mocked(shouldWarmRouteOnOverview)

function buildRoute(overrides: Partial<DemoRoute> = {}): DemoRoute {
  return {
    pageId: 'oscilloscope',
    path: '/oscilloscope',
    label: '示波器',
    Component: (() => null) as DemoRoute['Component'],
    preload: async () => undefined,
    touchProfile: {
      pageScroll: 'vertical-outside-canvas',
      canvasGestureScope: 'interactive-canvas',
      minTouchTargetPx: 44,
      gestureMatrix: {
        singleFingerRotate: true,
        twoFingerZoom: true,
        twoFingerPan: true,
      },
    },
    ...overrides,
  }
}

describe('NavigationPage Linear layout', () => {
  beforeEach(() => {
    mockedShouldWarmRouteOnOverview.mockReturnValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the overview with title', () => {
    render(<NavigationPage routes={[buildRoute()]} onOpenRoute={vi.fn()} />)

    expect(screen.getByText('物理演示')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '高中物理 3D 课堂' })).toBeInTheDocument()
  })

  it('renders all regions with scenes in the list', () => {
    render(<NavigationPage routes={[buildRoute()]} onOpenRoute={vi.fn()} />)

    const main = screen.getByRole('main')
    expect(main.textContent).toContain('第十章 静电场中的能量')
    expect(main.textContent).toContain('示波器')
    expect(main.textContent).toContain('波形合成')
  })

  it('shows scenes in the main list grouped by region', () => {
    render(<NavigationPage routes={[buildRoute()]} onOpenRoute={vi.fn()} />)

    const main = screen.getByRole('main')
    expect(main.textContent).toContain('示波器')
    expect(main.textContent).toContain('波形合成')
  })

  it('opens a scene when its row is clicked', () => {
    const onOpenRoute = vi.fn()
    const routes = [
      buildRoute(),
      buildRoute({
        pageId: 'cyclotron',
        path: '/cyclotron',
        label: '回旋加速器',
      }),
    ]

    render(<NavigationPage routes={routes} onOpenRoute={onOpenRoute} />)

    fireEvent.click(screen.getAllByText('示波器')[0])
    expect(onOpenRoute).toHaveBeenCalledWith('/oscilloscope')

    fireEvent.click(screen.getAllByText('回旋加速器')[0])
    expect(onOpenRoute).toHaveBeenCalledWith('/cyclotron')
  })

  it('orders the textbook view by chapter teaching order', () => {
    const ids = findNavigationView('textbook').groups.flatMap((group) => group.scenePageIds)
    expect(ids.slice(0, 3)).toEqual(['ticker-timer', 'cart-velocity', 'celestial-motion'])
  })

  it('places every catalogued scene exactly once in every view', () => {
    for (const view of NAVIGATION_VIEWS) {
      const ids = view.groups.flatMap((group) => group.scenePageIds)
      expect(new Set(ids).size, view.id).toBe(ids.length)
      expect([...ids].sort(), view.id).toEqual(sceneCatalog.map((entry) => entry.pageId).sort())
    }
  })

  it('places every catalogued scene in exactly one topic', () => {
    const counts = new Map<string, number>()
    for (const region of PHYSICS_REGIONS) {
      for (const pageId of region.scenePageIds) counts.set(pageId, (counts.get(pageId) ?? 0) + 1)
    }
    for (const entry of sceneCatalog) {
      expect(counts.get(entry.pageId), entry.pageId).toBe(1)
    }
  })

  it('hides regions with no scenes', () => {
    render(<NavigationPage routes={[]} onOpenRoute={vi.fn()} />)

    const main = screen.getByRole('main')
    expect(main.textContent).not.toContain('第二章 匀变速直线运动的研究')
    expect(main.textContent).not.toContain('第二章 气体、固体和液体')
  })

  it('preloads scene module on hover dwell', () => {
    vi.useFakeTimers()
    const preload = vi.fn().mockResolvedValue(undefined)
    const route = buildRoute({ preload })

    render(<NavigationPage routes={[route]} onOpenRoute={vi.fn()} />)

    const sceneButton = screen.getAllByText('示波器')[0]
    fireEvent.pointerEnter(sceneButton)

    expect(preload).not.toHaveBeenCalled()
    vi.advanceTimersByTime(119)
    expect(preload).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(preload).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('cancels pending warmup when hover leaves before dwell threshold', () => {
    vi.useFakeTimers()
    const preload = vi.fn().mockResolvedValue(undefined)
    const route = buildRoute({ preload })

    render(<NavigationPage routes={[route]} onOpenRoute={vi.fn()} />)

    const sceneButton = screen.getAllByText('示波器')[0]
    fireEvent.pointerEnter(sceneButton)
    vi.advanceTimersByTime(60)
    fireEvent.pointerLeave(sceneButton)
    vi.advanceTimersByTime(200)

    expect(preload).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('warms route immediately on keyboard focus for accessibility', () => {
    vi.useFakeTimers()
    const preload = vi.fn().mockResolvedValue(undefined)
    const route = buildRoute({ preload })

    render(<NavigationPage routes={[route]} onOpenRoute={vi.fn()} />)

    fireEvent.focus(screen.getAllByText('示波器')[0])
    expect(preload).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('warms route immediately on touch pointer down', () => {
    vi.useFakeTimers()
    const preload = vi.fn().mockResolvedValue(undefined)
    const route = buildRoute({ preload })

    render(<NavigationPage routes={[route]} onOpenRoute={vi.fn()} />)

    fireEvent.pointerDown(screen.getAllByText('示波器')[0], {
      pointerType: 'touch',
    })

    expect(preload).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('swallows warmup preload rejection to avoid unhandled errors', async () => {
    vi.useFakeTimers()
    const preload = vi.fn().mockRejectedValue(new Error('transient warmup failure'))
    const route = buildRoute({ preload })

    render(<NavigationPage routes={[route]} onOpenRoute={vi.fn()} />)

    fireEvent.focus(screen.getAllByText('示波器')[0])

    await Promise.resolve()
    expect(preload).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
