import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../../store/useAppStore'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children }: { children: ReactNode }) => (
    <div data-testid="interactive-canvas">{children}</div>
  ),
}))

vi.mock('../ElectromagneticDriveRig3D', () => ({
  ElectromagneticDriveRig3D: () => <div data-testid="electromagnetic-drive-rig" />,
}))

import { ElectromagneticDriveScene } from '../ElectromagneticDriveScene'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('electromagnetic-drive classroom mode', () => {
  beforeEach(() => {
    setViewportWidth(1366)
    window.history.replaceState(null, '', '/electromagnetic-drive')
    useAppStore.setState({
      presentationMode: true,
      presentationRouteModes: { '/electromagnetic-drive': 'viewport' },
      activeScenePath: '/electromagnetic-drive',
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

  it('keeps core summary visible and exposes chart + telemetry signals when controls are collapsed', async () => {
    render(<ElectromagneticDriveScene />)

    expect(await screen.findByRole('button', { name: '显示控制面板' })).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: '课堂核心信息' })
    expect(within(summary).getByText(/实验状态:/)).toBeInTheDocument()
    expect(within(summary).getByText(/磁铁转速:/)).toBeInTheDocument()
    expect(within(summary).getByText(/铝框转速:/)).toBeInTheDocument()
    expect(within(summary).getByText(/跟随比:/)).toBeInTheDocument()

    const telemetryNode = document.querySelector(
      '.electromagnetic-drive-telemetry[data-presentation-signal~="live-metric"][data-presentation-signal~="interactive-readout"]',
    )
    const chartNode = document.querySelector(
      '.electromagnetic-drive-chart-card[data-presentation-signal~="chart"]',
    )

    expect(telemetryNode).toBeInTheDocument()
    expect(chartNode).toBeInTheDocument()
  })
})
