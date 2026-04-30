import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NavigationPage } from '../NavigationPage'
import type { DemoRoute } from '../../app/demoRoutes'
import { shouldWarmRouteOnOverview } from '../../app/routeWarmupPolicy'

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
    meta: {
      tag: '波形合成',
      summary: '双通道电压驱动 + 李萨如图形',
      highlights: ['函数编辑与预设切换', '荧光屏轨迹实时更新'],
      tone: 'scope',
    },
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

describe('NavigationPage warmup behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockedShouldWarmRouteOnOverview.mockReturnValue(true)
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('preloads scene module only after hover dwell', () => {
    const preload = vi.fn().mockResolvedValue(undefined)
    const route = buildRoute({ preload })

    render(<NavigationPage routes={[route]} onOpenRoute={vi.fn()} />)

    const button = screen.getByRole('button', { name: '进入示波器' })
    fireEvent.pointerEnter(button)

    expect(preload).not.toHaveBeenCalled()
    vi.advanceTimersByTime(119)
    expect(preload).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(preload).toHaveBeenCalledTimes(1)
  })

  it('cancels pending warmup when hover leaves before dwell threshold', () => {
    const preload = vi.fn().mockResolvedValue(undefined)
    const route = buildRoute({ preload })

    render(<NavigationPage routes={[route]} onOpenRoute={vi.fn()} />)

    const button = screen.getByRole('button', { name: '进入示波器' })
    fireEvent.pointerEnter(button)
    vi.advanceTimersByTime(60)
    fireEvent.pointerLeave(button)
    vi.advanceTimersByTime(200)

    expect(preload).not.toHaveBeenCalled()
  })

  it('keeps keyboard focus warmup immediate for accessibility', () => {
    const preload = vi.fn().mockResolvedValue(undefined)
    const route = buildRoute({ preload })

    render(<NavigationPage routes={[route]} onOpenRoute={vi.fn()} />)

    fireEvent.focus(screen.getByRole('button', { name: '进入示波器' }))

    expect(preload).toHaveBeenCalledTimes(1)
  })

  it('shows shortcut hint aligned with the number of available routes', () => {
    const routes = Array.from({ length: 8 }, (_, index) =>
      buildRoute({
        pageId: `demo-${index + 1}`,
        path: `/demo-${index + 1}`,
        label: `演示 ${index + 1}`,
      }),
    )

    render(<NavigationPage routes={routes} onOpenRoute={vi.fn()} />)

    expect(screen.getByText('快捷键: 1-8 进入演示, D/N 切换昼夜。')).toBeInTheDocument()
  })

  it('warms route immediately on touch pointer down for touch-first navigation', () => {
    const preload = vi.fn().mockResolvedValue(undefined)
    const route = buildRoute({ preload })

    render(<NavigationPage routes={[route]} onOpenRoute={vi.fn()} />)

    fireEvent.pointerDown(screen.getByRole('button', { name: '进入示波器' }), {
      pointerType: 'touch',
    })

    expect(preload).toHaveBeenCalledTimes(1)
  })

  it('swallows warmup preload rejection to avoid unhandled errors', async () => {
    const preload = vi.fn().mockRejectedValue(new Error('transient warmup failure'))
    const route = buildRoute({ preload })

    render(<NavigationPage routes={[route]} onOpenRoute={vi.fn()} />)
    fireEvent.focus(screen.getByRole('button', { name: '进入示波器' }))

    await Promise.resolve()
    expect(preload).toHaveBeenCalledTimes(1)
  })

  it('renders a safe overview card when route meta is malformed', () => {
    const route = buildRoute({
      label: null as unknown as DemoRoute['label'],
      meta: {
        tag: 42,
        summary: null,
        highlights: null,
        tone: 'broken-tone',
      } as unknown as DemoRoute['meta'],
    })

    render(<NavigationPage routes={[route]} onOpenRoute={vi.fn()} />)

    expect(screen.getByRole('heading', { name: '演示' })).toBeInTheDocument()
    expect(screen.getByText('课堂演示')).toBeInTheDocument()
    expect(screen.getByText('课堂演示信息待补充')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '进入演示' })).toBeInTheDocument()
  })

  it('passes a safe fallback path when route path metadata is malformed', () => {
    const onOpenRoute = vi.fn()
    const route = buildRoute({
      path: { broken: 'path' } as unknown as DemoRoute['path'],
    })

    render(<NavigationPage routes={[route]} onOpenRoute={onOpenRoute} />)
    fireEvent.click(screen.getByRole('button', { name: '进入示波器' }))

    expect(onOpenRoute).toHaveBeenCalledWith('/')
  })
})
