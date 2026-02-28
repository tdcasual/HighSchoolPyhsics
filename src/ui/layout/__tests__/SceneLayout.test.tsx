import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
    window.history.replaceState(null, '', '/test-scene')
    useAppStore.setState({
      presentationMode: false,
      presentationRouteModes: {},
      activeScenePath: '/test-scene',
    })
  })

  afterEach(() => {
    window.history.replaceState(null, '', '/')
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
        presentationSignals={[]}
        coreSummary={<p>核心信息</p>}
        controls={<h2>控制区</h2>}
        viewport={<div>三维视图</div>}
      />,
    )

    expect(screen.getByText('控制区').closest('.control-panel')).toBeInTheDocument()
    expect(screen.getByText('三维视图').closest('.viewport-panel')).toBeInTheDocument()
    expect(document.querySelector('.scene-layout--desktop')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '展开参数面板' })).not.toBeInTheDocument()
  })

  it('supports pointer drag resizing on desktop split layout', () => {
    setViewportWidth(1366)

    render(
      <SceneLayout
        presentationSignals={[]}
        coreSummary={<p>核心信息</p>}
        controls={<h2>控制区</h2>}
        viewport={<div>三维视图</div>}
      />,
    )

    const layout = document.querySelector('.scene-layout--desktop') as HTMLElement
    const divider = screen.getByRole('separator', { name: '调整左右面板宽度' })

    expect(layout.style.gridTemplateColumns).toContain('320px')

    fireEvent.pointerDown(divider, { pointerId: 1, clientX: 420 })
    fireEvent.pointerMove(divider, { pointerId: 1, clientX: 540 })
    fireEvent.pointerUp(divider, { pointerId: 1, clientX: 540 })

    expect(layout.style.gridTemplateColumns).toContain('440px')
  })

  it('renders mobile layout with collapsed controls and touch toggle', () => {
    setViewportWidth(390)

    render(
      <SceneLayout
        presentationSignals={[]}
        coreSummary={<p>核心信息</p>}
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
        presentationSignals={[]}
        coreSummary={<p>核心信息</p>}
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
        coreSummary={<p>核心信息</p>}
        controls={<h2>控制区</h2>}
        viewport={<div>三维视图</div>}
      />,
    )

    const layout = document.querySelector('.scene-layout--desktop') as HTMLElement
    const panel = screen.getByText('控制区').closest('.control-panel') as HTMLElement
    expect(panel).toHaveAttribute('aria-hidden', 'false')
    expect(document.querySelector('.scene-layout--presentation-split')).toBeInTheDocument()
    expect(layout.style.gridTemplateColumns).toContain('447px')
    expect(screen.queryByRole('button', { name: '显示控制面板' })).not.toBeInTheDocument()
  })

  it('keeps core summary visible when controls are collapsed in presentation viewport mode', () => {
    setViewportWidth(1366)
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/test-scene': 'viewport' },
    })

    render(
      <SceneLayout
        presentationSignals={[]}
        controls={<h2>控制区</h2>}
        viewport={<div>三维视图</div>}
        coreSummary={<p>核心信息: U=12.5V</p>}
      />,
    )

    expect(screen.getByText('核心信息: U=12.5V')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    expect((screen.getByText('控制区').closest('.control-panel') as HTMLElement)).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('keeps core summary visible on mobile in presentation mode while controls stay collapsed by default', () => {
    setViewportWidth(390)
    useAppStore.setState({ presentationMode: true })

    render(
      <SceneLayout
        presentationSignals={[]}
        controls={<h2>控制区</h2>}
        viewport={<div>三维视图</div>}
        coreSummary={<p>核心信息: 课堂保底摘要</p>}
      />,
    )

    expect(screen.getByText('核心信息: 课堂保底摘要')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    expect((screen.getByText('控制区').closest('.control-panel') as HTMLElement)).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('restores split default width when route override changes from viewport to split in presentation mode', async () => {
    setViewportWidth(1366)
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/test-scene': 'viewport' },
    })

    render(
      <SceneLayout
        presentationSignals={[]}
        coreSummary={<p>核心信息</p>}
        controls={<h2>控制区</h2>}
        viewport={<div>三维视图</div>}
      />,
    )

    const layout = document.querySelector('.scene-layout') as HTMLElement
    expect(layout.style.gridTemplateColumns).toBe('')
    expect(screen.getByRole('button', { name: '显示控制面板' })).toBeInTheDocument()

    useAppStore.setState({
      presentationRouteModes: { '/test-scene': 'split' },
    })

    await waitFor(() => {
      expect(document.querySelector('.scene-layout--presentation-split')).toBeInTheDocument()
      expect(layout.style.gridTemplateColumns).toContain('447px')
    })
    expect(screen.queryByRole('button', { name: '显示控制面板' })).not.toBeInTheDocument()
  })
})
