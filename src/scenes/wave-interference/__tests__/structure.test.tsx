import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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
  })

  it('uses always frameloop when playing by default', () => {
    render(<WaveInterferenceScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
  })

  it('shows the data overlay values by default', () => {
    render(<WaveInterferenceScene />)

    expect(screen.getByText(/波程差/)).toBeInTheDocument()
    expect(screen.getByText(/相位差/)).toBeInTheDocument()
    expect(screen.getByText(/合振幅/)).toBeInTheDocument()
  })
})
