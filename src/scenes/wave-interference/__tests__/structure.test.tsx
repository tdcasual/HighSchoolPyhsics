import type { ReactNode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({
    children,
    frameloop,
  }: {
    children: ReactNode
    frameloop?: string
  }) => (
    <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>
      {children}
    </div>
  ),
}))

vi.mock('../WaveInterferenceRig3D', () => ({
  WaveInterferenceRig3D: () => <div data-testid="wave-rig" />,
}))

vi.mock('../WaveInterferenceControls', () => ({
  WaveInterferenceControls: () => <div data-testid="wave-controls" />,
}))

vi.mock('../WaveInterferenceChart', () => ({
  WaveInterferenceChart: () => <div data-testid="wave-chart" />,
}))

import { WaveInterferenceScene } from '../WaveInterferenceScene'

describe('wave-interference structure', () => {
  it('renders controls, viewport and rig', () => {
    render(<WaveInterferenceScene />)

    expect(screen.getByTestId('interactive-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('wave-controls')).toBeInTheDocument()
    expect(screen.getByTestId('wave-rig')).toBeInTheDocument()
  })

  it('uses always frameloop when playing by default', () => {
    render(<WaveInterferenceScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
  })

  it('starts with the data overlay collapsed and shows values when expanded', () => {
    render(<WaveInterferenceScene />)

    const dataPanel = within(screen.getByRole('region', { name: '数据' }))
    expect(dataPanel.queryByText(/波程差/)).not.toBeInTheDocument()
    fireEvent.click(dataPanel.getByRole('button', { name: '展开' }))

    expect(screen.getByText(/波程差/)).toBeInTheDocument()
    expect(screen.getByText(/相位差/)).toBeInTheDocument()
    expect(screen.getByText(/合振幅/)).toBeInTheDocument()
  })
})
