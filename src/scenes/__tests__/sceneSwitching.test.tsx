import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { useAppStore } from '../../store/useAppStore'

function navigateToScene(sceneName: string) {
  fireEvent.click(screen.getByRole('button', { name: '返回导航' }))
  fireEvent.click(screen.getByText(sceneName))
}

function expandPanels() {
  screen.queryAllByRole('button', { name: '展开' }).forEach((button) => fireEvent.click(button))
}

describe('scene switching', () => {
  beforeEach(() => {
    useAppStore.setState({ theme: 'day' })
    window.history.replaceState(null, '', '/')
  })

  it('navigates demos from overview page and returns back to overview', { timeout: 30_000 }, async () => {
    const { container } = render(<App />)
    const asyncWait = { timeout: 8000 }

    expect(await screen.findByText('物理演示', {}, asyncWait)).toBeInTheDocument()

    // Navigate to oscilloscope
    fireEvent.click(screen.getByText('示波器'))
    expect(window.location.pathname).toBe('/oscilloscope')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('X 偏转电压 Ux(t)', {}, asyncWait)).toBeInTheDocument()
    // Several scenes open with their playback panel collapsed.
    expandPanels()
    expect(await screen.findByRole('button', { name: '播放' }, asyncWait)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '夜间模式' }))
    expect(container.querySelector('.app-shell')).toHaveClass('theme-night')

    navigateToScene('回旋加速器')
    expect(window.location.pathname).toBe('/cyclotron')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('磁场 B', {}, asyncWait)).toBeInTheDocument()
    expandPanels()
    expect(await screen.findByRole('button', { name: '播放' }, asyncWait)).toBeInTheDocument()
    expect(container.querySelector('.app-shell')).toHaveClass('theme-night')

    navigateToScene('磁流体发电机')
    expect(window.location.pathname).toBe('/mhd')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('磁流体发电机控制', {}, asyncWait)).toBeInTheDocument()
    expect(await screen.findByText('等离子体速度 v', {}, asyncWait)).toBeInTheDocument()
    expandPanels()
    expect(await screen.findByRole('button', { name: '播放' }, asyncWait)).toBeInTheDocument()

    navigateToScene('导体棒切割磁感线')
    expect(window.location.pathname).toBe('/motional-emf')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('切割磁感线实验控制', {}, asyncWait)).toBeInTheDocument()
    expandPanels()
    expect(await screen.findByRole('button', { name: '单步 0.1 s' }, asyncWait)).toBeInTheDocument()

    navigateToScene('电磁驱动')
    expect(window.location.pathname).toBe('/electromagnetic-drive')
    await waitFor(() => expect(screen.queryByText('加载场景...')).not.toBeInTheDocument(), asyncWait)
    expect(await screen.findByText('电磁驱动控制', {}, asyncWait)).toBeInTheDocument()
    expandPanels()
    expect(await screen.findByText('实时角速度对比', {}, asyncWait)).toBeInTheDocument()
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
