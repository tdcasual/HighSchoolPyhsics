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

describe('NavigationPage Linear layout', () => {
  beforeEach(() => {
    mockedShouldWarmRouteOnOverview.mockReturnValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the overview with title', () => {
    render(<NavigationPage routes={[buildRoute()]} onOpenRoute={vi.fn()} />)

    expect(screen.getByRole('heading', { name: '物理演示' })).toBeInTheDocument()
    expect(screen.getByText('高中物理课堂 3D 交互演示')).toBeInTheDocument()
  })

  it('renders sidebar with all regions', () => {
    render(<NavigationPage routes={[buildRoute()]} onOpenRoute={vi.fn()} />)

    const sidebar = screen.getByRole('navigation', { name: '物理区域' })
    expect(sidebar).toBeInTheDocument()
    expect(sidebar.textContent).toContain('静电学')
    expect(sidebar.textContent).toContain('电磁学')
    expect(sidebar.textContent).toContain('电磁感应')
    expect(sidebar.textContent).toContain('波动与振动')
    expect(sidebar.textContent).toContain('力学')
    expect(sidebar.textContent).toContain('热学')
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
        meta: {
          tag: '粒子动力学',
          summary: '交变电场加速 + 磁场轨道约束',
          highlights: ['U-t / Ek-t 双曲线'],
          tone: 'cyclotron',
        },
      }),
    ]

    render(<NavigationPage routes={routes} onOpenRoute={onOpenRoute} />)

    fireEvent.click(screen.getAllByText('示波器')[0])
    expect(onOpenRoute).toHaveBeenCalledWith('/oscilloscope')

    fireEvent.click(screen.getAllByText('回旋加速器')[0])
    expect(onOpenRoute).toHaveBeenCalledWith('/cyclotron')
  })

  it('shows empty state for regions with no scenes', () => {
    render(<NavigationPage routes={[]} onOpenRoute={vi.fn()} />)

    expect(screen.getAllByText('该区域暂无演示场景').length).toBeGreaterThanOrEqual(2)
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
