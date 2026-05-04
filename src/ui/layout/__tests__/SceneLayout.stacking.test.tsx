import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SceneLayout } from '../SceneLayout'

describe('SceneLayout panel stacking', () => {
  it('renders data and chart panels when both provided', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
        dataOverlay={<div>data-content</div>}
        chart={<div>chart-content</div>}
        chartVisible
      />,
    )
    expect(screen.getByText('data-content')).toBeInTheDocument()
    expect(screen.getByText('chart-content')).toBeInTheDocument()
  })

  it('renders playback panel alongside data and chart', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
        dataOverlay={<div>data-content</div>}
        chart={<div>chart-content</div>}
        chartVisible
        playbackActions={[{ key: 'play', label: '播放', onClick: () => {} }]}
      />,
    )
    expect(screen.getByText('data-content')).toBeInTheDocument()
    expect(screen.getByText('chart-content')).toBeInTheDocument()
    expect(screen.getByText('播放')).toBeInTheDocument()
  })

  it('resets chart dismiss when chartVisible transitions false to true', () => {
    const { rerender } = render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
        chart={<div>chart-content</div>}
        chartVisible={false}
      />,
    )
    expect(screen.queryByText('chart-content')).not.toBeInTheDocument()

    rerender(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
        chart={<div>chart-content</div>}
        chartVisible
      />,
    )
    expect(screen.getByText('chart-content')).toBeInTheDocument()
  })

  it('does not render data panel when not provided', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
      />,
    )
    expect(screen.queryByText('数据')).not.toBeInTheDocument()
  })
})
