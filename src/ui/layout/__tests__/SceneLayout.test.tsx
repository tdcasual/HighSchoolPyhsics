import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SceneLayout } from '../SceneLayout'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('SceneLayout', () => {
  afterEach(() => {
    setViewportWidth(1024)
  })

  it('renders desktop layout with side-by-side control and viewport containers', () => {
    setViewportWidth(1366)

    render(
      <SceneLayout
        controls={<h2>控制区</h2>}
        viewport={<div>三维视图</div>}
      />,
    )

    expect(screen.getByText('控制区').closest('.control-panel')).toBeInTheDocument()
    expect(screen.getByText('三维视图').closest('.viewport-panel')).toBeInTheDocument()
    expect(document.querySelector('.scene-layout--desktop')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '展开参数面板' })).not.toBeInTheDocument()
  })

  it('renders mobile layout with collapsed controls and touch toggle', () => {
    setViewportWidth(390)

    render(
      <SceneLayout
        controls={<h2>控制区</h2>}
        viewport={<div>三维视图</div>}
      />,
    )

    const panel = screen.getByText('控制区').closest('.control-panel') as HTMLElement
    expect(document.querySelector('.scene-layout--mobile')).toBeInTheDocument()
    expect(panel).toHaveAttribute('aria-hidden', 'true')

    fireEvent.click(screen.getByRole('button', { name: '展开参数面板' }))
    expect(panel).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByRole('button', { name: '收起参数面板' })).toBeInTheDocument()
  })
})
