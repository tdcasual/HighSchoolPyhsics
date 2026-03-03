import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'
import { InductionCurrentScene } from '../InductionCurrentScene'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('induction-current classroom mode', () => {
  beforeEach(() => {
    setViewportWidth(1366)
    window.history.replaceState(null, '', '/induction-current')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/induction-current': 'viewport' },
      activeScenePath: '/induction-current',
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
    render(<InductionCurrentScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: '课堂核心信息' })
    expect(within(summary).getByText(/磁极朝向:/)).toBeInTheDocument()
    expect(within(summary).getByText(/实验记录:/)).toBeInTheDocument()

    const signalNode = document.querySelector(
      '.induction-current-records[data-presentation-signal~="interactive-readout"][data-presentation-signal~="live-metric"]',
    )
    expect(signalNode).toBeInTheDocument()
  })
})
