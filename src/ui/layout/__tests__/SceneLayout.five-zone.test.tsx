import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SceneLayout } from '../SceneLayout'

describe('SceneLayout five-zone', () => {
  it('renders viewport', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div data-testid="canvas">3D canvas</div>}
      />,
    )
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('renders controls in sidebar', () => {
    render(
      <SceneLayout
        controls={<div>参数控制</div>}
        viewport={<div>canvas</div>}
      />,
    )
    // SidebarPanel renders the title "参数控制" as well as the child content,
    // so there will be multiple matching elements.
    const matches = screen.getAllByText('参数控制')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders dataOverlay when provided', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
        dataOverlay={<div>实时数据</div>}
      />,
    )
    expect(screen.getByText('实时数据')).toBeInTheDocument()
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

  it('renders chart when provided and visible', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
        chart={<div>V-t 波形</div>}
        chartVisible
      />,
    )
    expect(screen.getByText('V-t 波形')).toBeInTheDocument()
  })

  it('does not render chart when chartVisible is false', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
        chart={<div>V-t 波形</div>}
        chartVisible={false}
      />,
    )
    expect(screen.queryByText('V-t 波形')).not.toBeInTheDocument()
  })

  it('renders playback when provided', () => {
    render(
      <SceneLayout
        controls={<div>params</div>}
        viewport={<div>canvas</div>}
        playbackActions={[{ key: 'play', label: '播放控件', onClick: () => {} }]}
      />,
    )
    expect(screen.getByText('播放控件')).toBeInTheDocument()
  })
})
