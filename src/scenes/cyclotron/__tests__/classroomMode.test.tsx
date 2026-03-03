import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'
import { CyclotronScene } from '../CyclotronScene'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('cyclotron classroom mode', () => {
  beforeEach(() => {
    setViewportWidth(1366)
    window.history.replaceState(null, '', '/cyclotron')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/cyclotron': 'viewport' },
      activeScenePath: '/cyclotron',
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
    render(<CyclotronScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: '课堂核心信息' })
    expect(within(summary).getByText(/电压方向:/)).toBeInTheDocument()
    expect(within(summary).getByText(/Ek:/)).toBeInTheDocument()

    const liveMetricNode = document.querySelector('.readings[data-presentation-signal~="live-metric"]')
    const chartNode = document.querySelector('.cyclotron-plot-card[data-presentation-signal~="chart"]')
    expect(liveMetricNode).toBeInTheDocument()
    expect(chartNode).toBeInTheDocument()
  })
})
