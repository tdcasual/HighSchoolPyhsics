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
  })
})
