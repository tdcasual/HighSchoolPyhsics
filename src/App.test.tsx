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
      largeText: true,
      presenting: false,
      navView: 'textbook',
    })
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the product title and overview navigation entries', async () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: '教学动画演示' }),
    ).toBeInTheDocument()
    // The overview is loaded on demand.
    expect(await screen.findByText('物理演示')).toBeInTheDocument()
    expect(document.title).toBe('教学动画演示')

    // Scenes are grouped by textbook chapter
    for (const chapter of ['第二章 匀变速直线运动的研究', '第十一章 电路及其应用', '第二章 电磁感应', '第四章 光', '第二章 气体、固体和液体']) {
      expect(screen.getByRole('heading', { level: 2, name: chapter })).toBeInTheDocument()
    }
    // …and every scene is listed exactly once
    expect(screen.getAllByRole('button', { name: /^游标卡尺/ })).toHaveLength(1)
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

  it('switches the overview between textbook, topic and lesson-type views', async () => {
    useAppStore.setState({ navView: 'textbook' })
    render(<App />)
    expect(await screen.findByRole('heading', { level: 2, name: '第十一章 电路及其应用' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: '按专题' }))
    expect(screen.getByRole('heading', { level: 2, name: '电磁感应与交变电流' })).toBeInTheDocument()
    expect(useAppStore.getState().navView).toBe('topic')

    fireEvent.click(screen.getByRole('radio', { name: '按课型' }))
    expect(screen.getByRole('heading', { level: 2, name: '学生实验' })).toBeInTheDocument()
    // 1 follows the visible numbering: card 01 of 按课型 is the first experiment in teaching order.
    fireEvent.keyDown(window, { key: '1' })
    expect(window.location.pathname).toBe('/ticker-timer')
    useAppStore.setState({ navView: 'textbook' })
  })

  it('filters the overview with search', async () => {
    render(<App />)
    const search = await screen.findByRole('searchbox', { name: '搜索场景' })
    fireEvent.change(search, { target: { value: '洛伦兹' } })
    expect(screen.getAllByText('磁流体发电机').length).toBeGreaterThan(0)
    expect(screen.queryByText('打点计时器')).not.toBeInTheDocument()
    fireEvent.change(search, { target: { value: '不存在的场景' } })
    expect(screen.getByText(/没有找到/)).toBeInTheDocument()
  })

  it('toggles classroom large text from the header and the L shortcut', () => {
    const { container } = render(<App />)
    const shell = container.querySelector('.app-shell') as HTMLElement
    const toggle = within(shell).getByRole('button', { name: '大字' })

    // Classroom projection is the default.
    expect(shell).toHaveClass('text-large')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(toggle)
    expect(shell).not.toHaveClass('text-large')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    fireEvent.keyDown(window, { key: 'l' })
    expect(shell).toHaveClass('text-large')
  })

  it('enters lecture mode on scene pages and leaves it with Esc or the exit button', async () => {
    window.history.replaceState(null, '', '/oscilloscope')
    const { container } = render(<App />)
    const shell = container.querySelector('.app-shell') as HTMLElement
    await screen.findByText('X 偏转电压 Ux(t)', {}, { timeout: 3000 })

    fireEvent.click(within(shell).getByRole('button', { name: '讲解' }))
    expect(shell).toHaveClass('presenting')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(shell).not.toHaveClass('presenting')

    fireEvent.keyDown(window, { key: 'p' })
    expect(shell).toHaveClass('presenting')
    fireEvent.click(screen.getByRole('button', { name: '退出讲解' }))
    expect(shell).not.toHaveClass('presenting')
  })

  it('offers no lecture mode on the overview page', () => {
    const { container } = render(<App />)
    const shell = container.querySelector('.app-shell') as HTMLElement
    expect(within(shell).queryByRole('button', { name: '讲解' })).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'p' })
    expect(shell).not.toHaveClass('presenting')
  })

  it('keeps root path on overview navigation page', async () => {
    window.history.replaceState(null, '', '/')

    render(<App />)

    expect(window.location.pathname).toBe('/')
    expect(await screen.findByText('物理演示')).toBeInTheDocument()
  })

  it('keeps scene action controls isolated from shell navigation styles', async () => {
    window.history.replaceState(null, '', '/oscilloscope')

    const { container } = render(<App />)

    expect(await screen.findByText('X 偏转电压 Ux(t)', {}, { timeout: 3000 })).toBeInTheDocument()

    expect(container.querySelector('.scene-nav')).not.toBeInTheDocument()
    screen.queryAllByRole('button', { name: '展开' }).forEach((button) => fireEvent.click(button))
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

    // 1 opens card 01 on the overview: the first scene of the first textbook chapter.
    await screen.findByText('物理演示')
    fireEvent.keyDown(window, { key: '1' })
    expect(await screen.findByText('打点计时器控制', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/ticker-timer')

    fireEvent.keyDown(window, { key: 'd' })
    expect(shell).toHaveClass('theme-day')
  })

  it('ignores malformed shortcut route paths instead of throwing', () => {
    const firstCard = DEMO_ROUTES.find((route) => route.pageId === 'ticker-timer')!
    const originalPath = firstCard.path
    ;(firstCard as { path: unknown }).path = { broken: 'path' }

    try {
      render(<App />)

      expect(() => fireEvent.keyDown(window, { key: '1' })).not.toThrow()
      expect(window.location.pathname).toBe('/')
    } finally {
      ;(firstCard as { path: unknown }).path = originalPath
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

    expect(await screen.findByText('X 偏转电压 Ux(t)', {}, { timeout: 3000 })).toBeInTheDocument()

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
        hasWebGL1: false,
        supported: false,
        missing: ['Worker', 'WebGL'],
      })

    render(<App />)

    expect(screen.getByRole('heading', { name: '运行环境不支持' })).toBeInTheDocument()
    expect(screen.getByText('当前窗口没有可用的 3D 图形接口，所以演示被拦住了。')).toBeInTheDocument()
    expect(screen.getByText('Worker')).toBeInTheDocument()
    expect(screen.getByText('WebGL')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '教学动画演示' })).not.toBeInTheDocument()
  })
})
