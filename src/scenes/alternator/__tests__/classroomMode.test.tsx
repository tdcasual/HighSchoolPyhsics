import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children }: { children: ReactNode }) => <div data-testid="interactive-canvas">{children}</div>,
}))

vi.mock('../AlternatorRig3D', () => ({
  AlternatorRig3D: () => <div data-testid="alternator-rig" />,
}))

import { AlternatorScene } from '../AlternatorScene'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('alternator classroom mode', () => {
  beforeEach(() => {
    setViewportWidth(1366)
    window.history.replaceState(null, '', '/alternator')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/alternator': 'viewport' },
      activeScenePath: '/alternator',
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

  it('keeps summary visible and exposes waveform + telemetry signals when controls collapse', async () => {
    render(<AlternatorScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: '课堂核心信息' })
    expect(within(summary).getByText(/转速 ω:/)).toBeInTheDocument()
    expect(within(summary).getByText(/频率 f:/)).toBeInTheDocument()
    expect(within(summary).getByText(/感应电压 e:/)).toBeInTheDocument()
    expect(within(summary).getByText(/电流表偏角:/)).toBeInTheDocument()

    const telemetryNode = document.querySelector(
      '.alternator-telemetry[data-presentation-signal~="live-metric"][data-presentation-signal~="interactive-readout"]',
    )
    const chartNode = document.querySelector(
      '.alternator-chart-card[data-presentation-signal~="chart"][data-presentation-signal~="time-series"]',
    )

    expect(telemetryNode).toBeInTheDocument()
    expect(chartNode).toBeInTheDocument()
  })
})
