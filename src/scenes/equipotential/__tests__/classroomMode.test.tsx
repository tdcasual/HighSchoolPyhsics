import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'
import { EquipotentialScene } from '../EquipotentialScene'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('equipotential classroom mode', () => {
  beforeEach(() => {
    setViewportWidth(1366)
    window.history.replaceState(null, '', '/equipotential')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/equipotential': 'viewport' },
      activeScenePath: '/equipotential',
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
    render(<EquipotentialScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()

    const summary = await screen.findByRole('region', { name: '课堂核心信息' })
    expect(within(summary).getByText(/电荷数:/)).toBeInTheDocument()
    expect(within(summary).getByText(/势场范围:/)).toBeInTheDocument()

    const signalNode = document.querySelector(
      '.equipotential-readout[data-presentation-signal~="chart"][data-presentation-signal~="live-metric"]',
    )
    expect(signalNode).toBeInTheDocument()
  })
})
