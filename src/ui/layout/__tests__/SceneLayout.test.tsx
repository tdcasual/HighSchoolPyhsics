import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SceneLayout } from '../SceneLayout'
import { useAppStore } from '../../../store/useAppStore'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('SceneLayout', () => {
  beforeEach(() => {
    useAppStore.setState({
      presentationMode: false,
      presentationRouteModes: {},
      activeScenePath: '/test-scene',
    })
  })

  afterEach(() => {
    useAppStore.setState({
      presentationMode: false,
      presentationRouteModes: {},
      activeScenePath: '/test-scene',
    })
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

  it('defaults to viewport-priority layout in presentation mode on desktop', () => {
    setViewportWidth(1366)
    useAppStore.setState({ presentationMode: true })

    render(
      <SceneLayout
        controls={<h2>控制区</h2>}
        viewport={<div>三维视图</div>}
      />,
    )

    const panel = screen.getByText('控制区').closest('.control-panel') as HTMLElement
    expect(document.querySelector('.scene-layout--presentation')).toBeInTheDocument()
    expect(panel).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: '显示控制面板' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '显示控制面板' }))
    expect(panel).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByRole('button', { name: '隐藏控制面板' })).toBeInTheDocument()
  })

  it('keeps side-by-side layout in presentation mode when auto-detected signal marks core chart', () => {
    setViewportWidth(1366)
    useAppStore.setState({ presentationMode: true })

    render(
      <SceneLayout
        presentationSignals={['chart']}
        controls={<h2>控制区</h2>}
        viewport={<div>三维视图</div>}
      />,
    )

    const panel = screen.getByText('控制区').closest('.control-panel') as HTMLElement
    expect(panel).toHaveAttribute('aria-hidden', 'false')
    expect(document.querySelector('.scene-layout--presentation-split')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '显示控制面板' })).not.toBeInTheDocument()
  })
})
