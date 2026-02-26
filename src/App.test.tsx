import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { useAppStore } from './store/useAppStore'

describe('App shell', () => {
  beforeEach(() => {
    useAppStore.setState({ theme: 'day' })
    window.history.replaceState(null, '', '/')
  })

  it('renders the product title and overview navigation entries', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: '3D Electromagnetics Lab' }),
    ).toBeInTheDocument()
    expect(screen.getByText('从单入口进入各个演示页面，避免课堂演示中跨页干扰。')).toBeInTheDocument()
    expect(screen.getByText('双通道电压驱动 + 李萨如图形')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '进入示波器' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '进入回旋加速器' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '进入磁流体发电机' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '进入奥斯特实验' })).toBeInTheDocument()
  })

  it('supports day/night mode across the app shell', () => {
    const { container } = render(<App />)

    const shell = container.querySelector('.app-shell') as HTMLElement
    const scoped = within(shell)

    expect(shell).toHaveClass('theme-day')

    fireEvent.click(scoped.getByRole('button', { name: '夜间模式' }))
    expect(shell).toHaveClass('theme-night')

    fireEvent.click(scoped.getByRole('button', { name: '白天模式' }))
    expect(shell).toHaveClass('theme-day')
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

    expect(await screen.findByText('X 电场 Ux(t)')).toBeInTheDocument()

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
})
