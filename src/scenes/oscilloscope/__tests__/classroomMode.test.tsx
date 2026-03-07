import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'
import { OscilloscopeScene } from '../OscilloscopeScene'

function setViewportSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('oscilloscope classroom mode', () => {
  beforeEach(() => {
    setViewportSize(1920, 1080)
    window.history.replaceState(null, '', '/oscilloscope')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/oscilloscope': 'viewport' },
      activeScenePath: '/oscilloscope',
    })
  })

  afterEach(() => {
    window.history.replaceState(null, '', '/')
    useAppStore.setState({
      presentationMode: false,
      presentationRouteModes: {},
      activeScenePath: '/',
    })
  })

  it('keeps core summary visible and exposes presentation signal markers', async () => {
    render(<OscilloscopeScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    expect(await screen.findByText(/Ux\(t\):/)).toBeInTheDocument()
    expect(await screen.findByText(/Uy\(t\):/)).toBeInTheDocument()

    const signalNode = document.querySelector(
      '.scope-card[data-presentation-signal~="chart"][data-presentation-signal~="live-metric"]',
    )
    expect(signalNode).toBeInTheDocument()
  })

  it('does not enable sticky summary by default in auto classroom mode', async () => {
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: {},
      activeScenePath: '/oscilloscope',
    })

    const { container } = render(<OscilloscopeScene />)

    await screen.findByText('示波器控制')

    expect(container.firstElementChild).toHaveAttribute('data-presentation-layout-decision', 'split')
    expect(screen.queryByRole('region', { name: '课堂核心信息' })).not.toBeInTheDocument()
  })
})
