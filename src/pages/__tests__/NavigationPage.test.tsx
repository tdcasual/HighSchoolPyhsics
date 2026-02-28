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
        doubleTapReset: true,
        threeFingerModeSwitch: true,
      },
    },
    classroom: {
      presentationSignals: ['chart', 'live-metric'],
      coreSummaryLineCount: 3,
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

  it('swallows warmup preload rejection to avoid unhandled errors', async () => {
    const preload = vi.fn().mockRejectedValue(new Error('transient warmup failure'))
    const route = buildRoute({ preload })

    render(<NavigationPage routes={[route]} onOpenRoute={vi.fn()} />)
    fireEvent.focus(screen.getByRole('button', { name: '进入示波器' }))

    await Promise.resolve()
    expect(preload).toHaveBeenCalledTimes(1)
  })
})
