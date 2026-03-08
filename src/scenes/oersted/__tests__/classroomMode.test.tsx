import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'
import { OerstedScene } from '../OerstedScene'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('oersted classroom mode', () => {
  beforeEach(() => {
    setViewportWidth(1366)
    window.history.replaceState(null, '', '/oersted')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/oersted': 'viewport' },
      activeScenePath: '/oersted',
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

  it('keeps core summary visible, exposes signal marker, and stays in overview focus mode by default', async () => {
    render(<OerstedScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: '课堂核心信息' })
    expect(within(summary).getByText(/最大可见摆动:/)).toBeInTheDocument()
    expect(within(summary).getByText(/可观察性:/)).toBeInTheDocument()

    const signalNode = document.querySelector(
      '.oersted-card[data-presentation-signal~="interactive-readout"]:not([data-presentation-signal~="live-metric"])',
    )
    expect(signalNode).toBeInTheDocument()
    expect(document.querySelector('[data-presentation-focus-mode="overview"]')).toBeInTheDocument()
  })
})
