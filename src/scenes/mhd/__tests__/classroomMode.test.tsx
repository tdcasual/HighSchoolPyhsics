import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'
import { MhdGeneratorScene } from '../MhdGeneratorScene'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('mhd classroom mode', () => {
  beforeEach(() => {
    setViewportWidth(1366)
    window.history.replaceState(null, '', '/mhd')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/mhd': 'viewport' },
      activeScenePath: '/mhd',
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

  it('keeps core summary visible and exposes presentation signal marker', async () => {
    render(<MhdGeneratorScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    expect(await screen.findByText(/输出电压 U_AB:/)).toBeInTheDocument()

    const signalNode = document.querySelector('.mhd-voltage-card[data-presentation-signal~="live-metric"]')
    expect(signalNode).toBeInTheDocument()
  })
})
