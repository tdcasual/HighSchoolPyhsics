import { fireEvent, render, screen } from '@testing-library/react'
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

    expect(await screen.findByRole('heading', { name: '演示导航' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '进入示波器' }))
    expect(window.location.pathname).toBe('/oscilloscope')
    expect(await screen.findByText('X 电场 Ux(t)')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '播放' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '夜间模式' }))
    expect(container.querySelector('.app-shell')).toHaveClass('theme-night')

    fireEvent.click(screen.getByRole('button', { name: '返回导航' }))
    expect(window.location.pathname).toBe('/')
    expect(await screen.findByRole('heading', { name: '演示导航' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '进入回旋加速器' }))
    expect(window.location.pathname).toBe('/cyclotron')
    expect(await screen.findByText('磁场 B (T)')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '播放' })).toBeInTheDocument()
    expect(container.querySelector('.app-shell')).toHaveClass('theme-night')

    fireEvent.click(screen.getByRole('button', { name: '返回导航' }))
    fireEvent.click(screen.getByRole('button', { name: '进入磁流体发电机' }))
    expect(window.location.pathname).toBe('/mhd')
    expect(await screen.findByText('磁流体发电机控制')).toBeInTheDocument()
    expect(await screen.findByText('等离子体速度 v (m/s)')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '播放' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '返回导航' }))
    fireEvent.click(screen.getByRole('button', { name: '进入奥斯特实验' }))
    expect(window.location.pathname).toBe('/oersted')
    expect(await screen.findByText('奥斯特电流磁效应')).toBeInTheDocument()
    expect(await screen.findByText('三枚小磁针位置（鼠标拖拽）')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '通电' })).toBeInTheDocument()
  })

  it('loads scene directly from url path', async () => {
    window.history.replaceState(null, '', '/mhd')

    render(<App />)

    expect(await screen.findByText('磁流体发电机控制')).toBeInTheDocument()
    expect(await screen.findByText('等离子体速度 v (m/s)')).toBeInTheDocument()
  })
})
