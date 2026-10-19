import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { SceneLayout } from '../SceneLayout'
import { useAppStore } from '../../../store/useAppStore'

function renderLayout(onPlay = vi.fn(), onReset = vi.fn()) {
  render(
    <SceneLayout
      controls={<input aria-label="公式" />}
      viewport={<div>canvas</div>}
      chart={<div>波形</div>}
      chartVisible
      playbackActions={[
        { key: 'toggle-running', label: '播放', onClick: onPlay },
        { key: 'reset', label: '重置', onClick: onReset },
      ]}
    />,
  )
  return { onPlay, onReset }
}

describe('SceneLayout playback zone', () => {
  it('opens the playback panel expanded', () => {
    renderLayout()
    const playback = screen.getByRole('region', { name: '播放控制' })
    expect(within(playback).getByRole('button', { name: '播放' })).toBeInTheDocument()
  })

  it('brings back a closed chart or playback panel from the restore dock', () => {
    renderLayout()
    fireEvent.click(within(screen.getByRole('region', { name: '图表' })).getByRole('button', { name: '关闭' }))
    fireEvent.click(within(screen.getByRole('region', { name: '播放控制' })).getByRole('button', { name: '关闭' }))
    expect(screen.queryByRole('region', { name: '图表' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '播放控制' })).not.toBeInTheDocument()

    const dock = screen.getByRole('toolbar', { name: '已关闭的面板' })
    fireEvent.click(within(dock).getByRole('button', { name: '显示图表' }))
    expect(screen.getByRole('region', { name: '图表' })).toBeInTheDocument()
    fireEvent.click(within(dock).getByRole('button', { name: '显示播放控制' }))
    expect(screen.getByRole('region', { name: '播放控制' })).toBeInTheDocument()
    expect(screen.queryByRole('toolbar', { name: '已关闭的面板' })).not.toBeInTheDocument()
  })

  it('toggles play with Space, even after the playback panel is closed', () => {
    const { onPlay, onReset } = renderLayout()
    fireEvent.keyDown(window, { key: ' ' })
    expect(onPlay).toHaveBeenCalledTimes(1)

    fireEvent.click(within(screen.getByRole('region', { name: '播放控制' })).getByRole('button', { name: '关闭' }))
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(onPlay).toHaveBeenCalledTimes(2)
    expect(onReset).not.toHaveBeenCalled()
  })

  it('leaves Space alone while typing', () => {
    const { onPlay } = renderLayout()
    fireEvent.keyDown(screen.getByRole('textbox', { name: '公式' }), { key: ' ' })
    expect(onPlay).not.toHaveBeenCalled()
  })

  it('offers shared slow motion only to scenes that opt in', () => {
    const { unmount } = render(<SceneLayout controls={<div />} viewport={<div />} playbackActions={[{ key: 'play', label: '播放', onClick: () => {} }]} />)
    expect(screen.queryByRole('radio', { name: '¼×' })).not.toBeInTheDocument()
    unmount()

    render(<SceneLayout timeControl controls={<div />} viewport={<div />} playbackActions={[{ key: 'play', label: '播放', onClick: () => {} }]} />)
    const playback = screen.getByRole('region', { name: '播放控制' })
    fireEvent.click(within(playback).getByRole('radio', { name: '¼×' }))
    expect(useAppStore.getState().playbackRate).toBe(0.25)
    useAppStore.setState({ playbackRate: 1 })
  })

  it('steps with the . key when the scene offers a step action', () => {
    const onStep = vi.fn()
    render(
      <SceneLayout
        controls={<div />}
        viewport={<div />}
        playbackActions={[
          { key: 'toggle-running', label: '播放', onClick: vi.fn() },
          { key: 'step', label: '单步 15°', onClick: onStep },
        ]}
      />,
    )
    fireEvent.keyDown(window, { key: '.' })
    expect(onStep).toHaveBeenCalledTimes(1)
  })
})
