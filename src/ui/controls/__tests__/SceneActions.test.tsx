import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SceneActions } from '../SceneActions'

describe('SceneActions', () => {
  it('renders all action buttons and dispatches click handlers', () => {
    const onPlay = vi.fn()
    const onReset = vi.fn()

    render(
      <SceneActions
        actions={[
          { key: 'play', label: '播放', onClick: onPlay },
          { key: 'reset', label: '重置', onClick: onReset },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    fireEvent.click(screen.getByRole('button', { name: '重置' }))

    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('supports vertically stacked actions for narrow control panels', () => {
    const { container } = render(
      <SceneActions layout="column" actions={[{ key: 'slice', label: '显示切片', onClick: vi.fn() }]} />,
    )

    expect(container.firstChild).toHaveClass('scene-actions-column')
  })

  it('supports a two-column action grid for narrow sidebars', () => {
    const { container } = render(
      <SceneActions
        layout="grid-2"
        actions={[
          { key: 'add-positive', label: '添加 + 电荷', onClick: vi.fn() },
          { key: 'add-negative', label: '添加 - 电荷', onClick: vi.fn() },
          { key: 'delete', label: '删除选中', onClick: vi.fn() },
          { key: 'probe', label: '开启探针模式', onClick: vi.fn() },
        ]}
      />,
    )

    expect(container.firstChild).toHaveClass('scene-actions-grid-2')
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('supports active button style by action key', () => {
    render(
      <SceneActions
        activeKey="toggle"
        actions={[
          { key: 'toggle', label: '暂停', onClick: () => undefined },
          { key: 'reset', label: '重置', onClick: () => undefined },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: '暂停' })).toHaveClass('active')
    expect(screen.getByRole('button', { name: '重置' })).not.toHaveClass('active')
    expect(screen.getByRole('button', { name: '暂停' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '重置' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: '暂停' })).toHaveClass('touch-target')
    expect(screen.getByRole('button', { name: '重置' })).toHaveClass('touch-target')
  })
})
