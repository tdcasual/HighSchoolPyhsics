import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'
import { MotionalEmfScene } from '../MotionalEmfScene'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('motional-emf classroom mode', () => {
  beforeEach(() => {
    setViewportWidth(1366)
    window.history.replaceState(null, '', '/motional-emf')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/motional-emf': 'viewport' },
      activeScenePath: '/motional-emf',
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

  it('keeps the core summary visible and exposes presentation signal markers', async () => {
    render(<MotionalEmfScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: '课堂核心信息' })
    expect(within(summary).getByText(/电压 U_AB:/)).toBeInTheDocument()
    expect(within(summary).getByText(/速度方向:/)).toBeInTheDocument()
    expect(within(summary).getByText(/磁场方向:/)).toBeInTheDocument()

    const signalNode = document.querySelector(
      '.motional-emf-voltage-card[data-presentation-signal~="live-metric"][data-presentation-signal~="interactive-readout"]',
    )
    expect(signalNode).toBeInTheDocument()
  })
})
