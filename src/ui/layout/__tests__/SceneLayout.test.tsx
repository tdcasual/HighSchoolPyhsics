import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SceneLayout } from '../SceneLayout'

describe('SceneLayout', () => {
  it('renders standard control and viewport containers', () => {
    render(
      <SceneLayout
        controls={<h2>控制区</h2>}
        viewport={<div>三维视图</div>}
      />,
    )

    expect(screen.getByText('控制区').closest('.control-panel')).toBeInTheDocument()
    expect(screen.getByText('三维视图').closest('.viewport-panel')).toBeInTheDocument()
    expect(document.querySelector('.scene-layout')).toBeInTheDocument()
  })
})
