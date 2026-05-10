import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
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

vi.mock('../WedgeInterferenceRig3D', () => ({
  WedgeInterferenceRig3D: () => <div data-testid="wedge-rig" />,
}))

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
    expect(screen.getByTestId('wedge-rig')).toBeInTheDocument()
  })

  it('uses demand frameloop for static scene', () => {
    render(<WedgeInterferenceScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })

  it('shows key data overlay values', () => {
    render(<WedgeInterferenceScene />)

    expect(screen.getByText(/波长 λ/)).toBeInTheDocument()
    expect(screen.getByText(/劈尖角 θ/)).toBeInTheDocument()
    expect(screen.getByText(/条纹间距 l/)).toBeInTheDocument()
    expect(screen.getByText(/可见条纹数/)).toBeInTheDocument()
    expect(screen.getByText(/下表面/)).toBeInTheDocument()
  })
})
