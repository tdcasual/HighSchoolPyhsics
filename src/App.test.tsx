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
      nightTone: 'minimal',
      presentationMode: false,
      presentationRouteModes: {},
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
    expect(screen.getByText('快捷键: 1-8 进入演示, D/N 切换昼夜。')).toBeInTheDocument()

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
    expect(shell).toHaveClass('night-tone-minimal')
    expect(dayButton).toHaveAttribute('aria-pressed', 'false')
    expect(nightButton).toHaveAttribute('aria-pressed', 'true')

    const minimalToneButton = scoped.getByRole('button', { name: '夜间极简' })
    const neonToneButton = scoped.getByRole('button', { name: '夜间霓虹' })

    expect(minimalToneButton).toHaveAttribute('aria-pressed', 'true')
    expect(neonToneButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(neonToneButton)
    expect(shell).toHaveClass('night-tone-neon')
    expect(minimalToneButton).toHaveAttribute('aria-pressed', 'false')
    expect(neonToneButton).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(dayButton)
    expect(shell).toHaveClass('theme-day')
    expect(shell).not.toHaveClass('night-tone-minimal')
    expect(shell).not.toHaveClass('night-tone-neon')
    expect(dayButton).toHaveAttribute('aria-pressed', 'true')
    expect(nightButton).toHaveAttribute('aria-pressed', 'false')

    expect(screen.queryByRole('button', { name: '夜间极简' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '夜间霓虹' })).not.toBeInTheDocument()
  })

  it('toggles classroom presentation mode from button and keyboard shortcut', () => {
    const { container } = render(<App />)

    const shell = container.querySelector('.app-shell') as HTMLElement
    const presentationButton = screen.getByRole('button', { name: '课堂展示' })

    expect(presentationButton).toHaveAttribute('aria-pressed', 'false')
    expect(shell).not.toHaveClass('presentation-mode')

    fireEvent.click(presentationButton)
    expect(presentationButton).toHaveAttribute('aria-pressed', 'true')
    expect(shell).toHaveClass('presentation-mode')
    expect(screen.getByText(/课堂展示中/)).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'p' })
    expect(presentationButton).toHaveAttribute('aria-pressed', 'false')
    expect(shell).not.toHaveClass('presentation-mode')
    expect(screen.queryByText(/课堂展示中/)).not.toBeInTheDocument()
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

    fireEvent.keyDown(window, { key: 'e' })
    expect(shell).toHaveClass('night-tone-neon')

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

    fireEvent.keyDown(formulaInput, { key: 'p' })
    expect(shell).not.toHaveClass('presentation-mode')
  })

  it('supports route-level presentation layout override in classroom mode', async () => {
    window.history.replaceState(null, '', '/cyclotron')

    render(<App />)

    expect(await screen.findByText('回旋加速器控制', {}, { timeout: 3000 })).toBeInTheDocument()

    const presentationButton = screen.getByRole('button', { name: '课堂展示' })
    fireEvent.click(presentationButton)

    const autoButton = screen.getByRole('button', { name: '自动' })
    const splitButton = screen.getByRole('button', { name: '双核心' })
    const viewportButton = screen.getByRole('button', { name: '视口优先' })

    expect(autoButton).toHaveAttribute('aria-pressed', 'true')
    expect(splitButton).toHaveAttribute('aria-pressed', 'false')
    expect(viewportButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(viewportButton)

    expect(autoButton).toHaveAttribute('aria-pressed', 'false')
    expect(viewportButton).toHaveAttribute('aria-pressed', 'true')
    expect(useAppStore.getState().presentationRouteModes['/cyclotron']).toBe('viewport')
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
