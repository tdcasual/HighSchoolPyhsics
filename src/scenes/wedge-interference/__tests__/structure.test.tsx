import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../WedgeInterferenceControls', () => ({
  WedgeInterferenceControls: () => <div data-testid="wedge-controls" />,
}))

vi.mock('../WedgeInterferenceChart', () => ({
  WedgeInterferenceChart: () => <div data-testid="wedge-chart" />,
}))

import { WedgeInterferenceScene } from '../WedgeInterferenceScene'

describe('wedge-interference structure', () => {
  it('renders controls, viewport and rig', () => {
    render(<WedgeInterferenceScene />)

    expect(screen.getByTestId('interactive-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('wedge-controls')).toBeInTheDocument()
  })

  it('uses demand frameloop for static scene', () => {
    render(<WedgeInterferenceScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })

  it('shows the data overlay by default and exposes key values when opened', () => {
    render(<WedgeInterferenceScene />)
    const dataPanel = screen.getByRole('region', { name: '数据' })
    expect(within(dataPanel).getByRole('button', { name: '折叠' })).toBeInTheDocument()

    expect(within(dataPanel).getByText(/条纹间距 l/)).toBeInTheDocument()
    expect(within(dataPanel).getByText(/视场最大间隙/)).toBeInTheDocument()
    expect(within(dataPanel).getByText(/可见条纹数/)).toBeInTheDocument()
    // λ and θ are the sidebar's own sliders; the notes restate them with l = λ/(2θ).
    expect(screen.getByText(/条纹间距 l = λ\/\(2θ\)/)).toBeInTheDocument()
  })
})
