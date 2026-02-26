import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { useAppStore } from '../../store/useAppStore'

describe('scene switching', () => {
  beforeEach(() => {
    useAppStore.setState({ theme: 'day' })
    window.history.replaceState(null, '', '/')
  })

  it('navigates demos from overview page and returns back to overview', async () => {
    const { container } = render(<App />)
    const asyncWait = { timeout: 8000 }

    expect(await screen.findByRole('heading', { name: '演示导航' }, asyncWait)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '进入示波器' }))
    expect(window.location.pathname).toBe('/oscilloscope')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('X 电场 Ux(t)', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '播放' }, asyncWait)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '夜间模式' }))
    expect(container.querySelector('.app-shell')).toHaveClass('theme-night')

    fireEvent.click(screen.getByRole('button', { name: '返回导航' }))
    expect(window.location.pathname).toBe('/')
    expect(await screen.findByRole('heading', { name: '演示导航' }, asyncWait)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '进入回旋加速器' }))
    expect(window.location.pathname).toBe('/cyclotron')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('磁场 B (T)', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '播放' }, asyncWait)).toBeInTheDocument()
    expect(container.querySelector('.app-shell')).toHaveClass('theme-night')

    fireEvent.click(screen.getByRole('button', { name: '返回导航' }))
    fireEvent.click(screen.getByRole('button', { name: '进入磁流体发电机' }))
    expect(window.location.pathname).toBe('/mhd')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('磁流体发电机控制', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByText('等离子体速度 v (m/s)', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '播放' }, asyncWait)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '返回导航' }))
    fireEvent.click(screen.getByRole('button', { name: '进入奥斯特实验' }))
    expect(window.location.pathname).toBe('/oersted')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('奥斯特电流磁效应', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByText('导线姿态（3D）', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '通电' }, asyncWait)).toBeInTheDocument()
  })

  it('loads scene directly from url path', async () => {
    window.history.replaceState(null, '', '/mhd')

    render(<App />)

    const asyncWait = { timeout: 8000 }
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('磁流体发电机控制', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByText('等离子体速度 v (m/s)', {}, asyncWait)).toBeInTheDocument()
  })
})
