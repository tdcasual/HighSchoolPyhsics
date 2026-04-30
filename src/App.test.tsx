import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { DEMO_ROUTES } from './app/demoRoutes'
import { useAppStore } from './store/useAppStore'
import * as runtimeCapabilities from './app/runtimeCapabilities'

describe('App shell', () => {
  beforeEach(() => {
    useAppStore.persist.clearStorage()
    useAppStore.setState({
      theme: 'day',
      activeScenePath: '/',
    })
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the product title and overview navigation entries', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: '教学动画演示' }),
    ).toBeInTheDocument()
    expect(screen.getByText('从单入口进入各个演示页面，避免课堂演示中跨页干扰。')).toBeInTheDocument()
    expect(screen.getByText('双通道电压驱动 + 李萨如图形')).toBeInTheDocument()
    expect(document.title).toBe('教学动画演示')
    expect(screen.getByText('快捷键: 1-9 进入前 9 个演示, D/N 切换昼夜。')).toBeInTheDocument()

    for (const route of DEMO_ROUTES) {
      expect(screen.getByRole('button', { name: `进入${route.label}` })).toBeInTheDocument()
    }
  })

  it('supports day/night mode across the app shell', () => {
    const { container } = render(<App />)

    const shell = container.querySelector('.app-shell') as HTMLElement
    const scoped = within(shell)
    const dayButton = scoped.getByRole('button', { name: '白天模式' })
    const nightButton = scoped.getByRole('button', { name: '夜间模式' })

    expect(shell).toHaveClass('theme-day')
    expect(dayButton).toHaveAttribute('aria-pressed', 'true')
    expect(nightButton).toHaveAttribute('aria-pressed', 'false')
    expect(dayButton).toHaveClass('touch-target')
    expect(nightButton).toHaveClass('touch-target')

    fireEvent.click(nightButton)
    expect(shell).toHaveClass('theme-night')
    expect(dayButton).toHaveAttribute('aria-pressed', 'false')
    expect(nightButton).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(dayButton)
    expect(shell).toHaveClass('theme-day')
    expect(dayButton).toHaveAttribute('aria-pressed', 'true')
    expect(nightButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps root path on overview navigation page', async () => {
    window.history.replaceState(null, '', '/')

    render(<App />)

    expect(window.location.pathname).toBe('/')
    expect(await screen.findByRole('heading', { name: '演示导航' })).toBeInTheDocument()
  })

  it('keeps scene action controls isolated from shell navigation styles', async () => {
    window.history.replaceState(null, '', '/oscilloscope')

    const { container } = render(<App />)

    expect(await screen.findByText('X 电场 Ux(t)', {}, { timeout: 3000 })).toBeInTheDocument()

    expect(container.querySelector('.scene-nav')).not.toBeInTheDocument()
    expect(container.querySelector('.scene-actions')).toBeInTheDocument()
    expect(container.querySelector('.scene-switch')).not.toBeInTheDocument()
  })

  it('renders each route inside a dedicated demo page wrapper', async () => {
    window.history.replaceState(null, '', '/mhd')

    render(<App />)

    expect(await screen.findByText('磁流体发电机控制')).toBeInTheDocument()
    const wrapper = screen.getByTestId('demo-page')
    expect(wrapper).toHaveAttribute('data-page-id', 'mhd')
  })

  it('supports keyboard shortcuts for quick classroom switching', async () => {
    const { container } = render(<App />)

    const shell = container.querySelector('.app-shell') as HTMLElement

    fireEvent.keyDown(window, { key: 'n' })
    expect(shell).toHaveClass('theme-night')

    fireEvent.keyDown(window, { key: '1' })
    expect(await screen.findByText('X 电场 Ux(t)', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/oscilloscope')

    fireEvent.keyDown(window, { key: 'd' })
    expect(shell).toHaveClass('theme-day')
  })

  it('ignores malformed shortcut route paths instead of throwing', () => {
    const originalPath = DEMO_ROUTES[0].path
    ;(DEMO_ROUTES[0] as { path: unknown }).path = { broken: 'path' }

    try {
      render(<App />)

      expect(() => fireEvent.keyDown(window, { key: '1' })).not.toThrow()
      expect(window.location.pathname).toBe('/')
    } finally {
      ;(DEMO_ROUTES[0] as { path: unknown }).path = originalPath
    }
  })

  it('ignores global shortcuts while typing in formula inputs', async () => {
    window.history.replaceState(null, '', '/oscilloscope')
    const { container } = render(<App />)

    const shell = container.querySelector('.app-shell') as HTMLElement
    const formulaInput = await screen.findByRole('textbox', { name: 'Ux(t) 函数' })

    fireEvent.keyDown(formulaInput, { key: 'n' })
    expect(shell).toHaveClass('theme-day')
  })

  it('applies the active route touch profile to shell interaction affordances', async () => {
    window.history.replaceState(null, '', '/oscilloscope')

    const { container } = render(<App />)

    expect(await screen.findByText('X 电场 Ux(t)', {}, { timeout: 3000 })).toBeInTheDocument()

    const shell = container.querySelector('.app-shell') as HTMLElement
    expect(shell).toHaveAttribute('data-page-scroll', 'vertical-outside-canvas')
    expect(shell).toHaveStyle('--touch-target-min-size: 44px')
  })

  it('renders safe missing-page route buttons when a route label is malformed', () => {
    window.history.replaceState(null, '', '/missing-demo')

    const originalLabel = DEMO_ROUTES[0].label
    ;(DEMO_ROUTES[0] as { label: unknown }).label = { broken: 'label' }

    try {
      render(<App />)

      expect(screen.getByRole('heading', { name: '页面不存在' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '演示 1' })).toBeInTheDocument()
    } finally {
      ;(DEMO_ROUTES[0] as { label: unknown }).label = originalLabel
    }
  })

  it('renders runtime capability blocking card when required features are unavailable', () => {
    vi
      .spyOn(runtimeCapabilities, 'getRuntimeCapabilities')
      .mockReturnValue({
        hasWorker: false,
        hasPointerEvents: true,
        hasWebGL2: false,
        supported: false,
        missing: ['Worker', 'WebGL2'],
      })

    render(<App />)

    expect(screen.getByRole('heading', { name: '运行环境不支持' })).toBeInTheDocument()
    expect(screen.getByText('当前浏览器不满足 3D 演示运行要求。')).toBeInTheDocument()
    expect(screen.getByText('Worker')).toBeInTheDocument()
    expect(screen.getByText('WebGL2')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '教学动画演示' })).not.toBeInTheDocument()
  })
})
