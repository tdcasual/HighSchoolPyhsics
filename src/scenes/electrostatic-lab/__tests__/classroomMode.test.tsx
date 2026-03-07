import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'
import { ElectrostaticLabScene } from '../ElectrostaticLabScene'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('electrostatic-lab classroom mode', () => {
  beforeEach(() => {
    setViewportWidth(1366)
    window.history.replaceState(null, '', '/electrostatic-lab')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/electrostatic-lab': 'viewport' },
      activeScenePath: '/electrostatic-lab',
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

  it('keeps core summary visible, exposes signal markers, and focuses the selected charge by default', async () => {
    render(<ElectrostaticLabScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: '课堂核心信息' })
    expect(within(summary).getByText(/电荷方案:/)).toBeInTheDocument()
    expect(within(summary).getByText(/势场范围:/)).toBeInTheDocument()

    const signalNode = document.querySelector(
      '.electrostatic-lab-readout[data-presentation-signal~="chart"][data-presentation-signal~="live-metric"]',
    )
    expect(signalNode).toBeInTheDocument()
    expect(document.querySelector('[data-presentation-focus-mode="focus"]')).toBeInTheDocument()
  })
})
