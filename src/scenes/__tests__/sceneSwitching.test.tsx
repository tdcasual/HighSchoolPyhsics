import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { useAppStore } from '../../store/useAppStore'

function navigateToScene(sceneName: string) {
  fireEvent.click(screen.getByRole('button', { name: '返回导航' }))
  fireEvent.click(screen.getByText(sceneName))
}

describe('scene switching', () => {
  beforeEach(() => {
    useAppStore.setState({ theme: 'day' })
    window.history.replaceState(null, '', '/')
  })

  it('navigates demos from overview page and returns back to overview', { timeout: 30_000 }, async () => {
    const { container } = render(<App />)
    const asyncWait = { timeout: 8000 }

    expect(await screen.findByRole('heading', { name: '物理演示' }, asyncWait)).toBeInTheDocument()

    // Navigate to oscilloscope
    fireEvent.click(screen.getByText('示波器'))
    expect(window.location.pathname).toBe('/oscilloscope')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('X 电场 Ux(t)', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '播放' }, asyncWait)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '夜间模式' }))
    expect(container.querySelector('.app-shell')).toHaveClass('theme-night')

    navigateToScene('回旋加速器')
    expect(window.location.pathname).toBe('/cyclotron')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('磁场 B', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '播放' }, asyncWait)).toBeInTheDocument()
    expect(container.querySelector('.app-shell')).toHaveClass('theme-night')

    navigateToScene('磁流体发电机')
    expect(window.location.pathname).toBe('/mhd')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('磁流体发电机控制', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByText('等离子体速度 v', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '播放' }, asyncWait)).toBeInTheDocument()

    navigateToScene('奥斯特实验')
    expect(window.location.pathname).toBe('/oersted')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('奥斯特实验控制', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByText('基本参数', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '通电' }, asyncWait)).toBeInTheDocument()

    navigateToScene('电磁驱动')
    expect(window.location.pathname).toBe('/electromagnetic-drive')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('电磁驱动控制', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByText('实时转速对比', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '开始摇动' }, asyncWait)).toBeInTheDocument()
  })

  it('loads scene directly from url path', async () => {
    window.history.replaceState(null, '', '/mhd')

    render(<App />)

    const asyncWait = { timeout: 8000 }
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('磁流体发电机控制', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByText('等离子体速度 v', {}, asyncWait)).toBeInTheDocument()
  })
})
