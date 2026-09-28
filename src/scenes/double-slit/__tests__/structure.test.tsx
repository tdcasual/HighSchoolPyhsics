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

vi.mock('../DoubleSlitRig3D', () => ({
  DoubleSlitRig3D: () => <div data-testid="double-slit-rig" />,
}))

vi.mock('../DoubleSlitControls', () => ({
  DoubleSlitControls: () => <div data-testid="double-slit-controls" />,
}))

vi.mock('../DoubleSlitChart', () => ({
  DoubleSlitChart: () => <div data-testid="double-slit-chart" />,
}))

import { DoubleSlitScene } from '../DoubleSlitScene'

describe('double-slit structure', () => {
  it('renders controls, viewport and rig', () => {
    render(<DoubleSlitScene />)

    expect(screen.getByTestId('interactive-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('double-slit-controls')).toBeInTheDocument()
    expect(screen.getByTestId('double-slit-rig')).toBeInTheDocument()
  })

  it('uses demand frameloop for static scene', () => {
    render(<DoubleSlitScene />)

    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })

  it('keeps the data overlay collapsed by default and exposes the measurement values when opened', () => {
    render(<DoubleSlitScene />)
    const dataPanel = screen.getByRole('region', { name: '数据' })
    fireEvent.click(within(dataPanel).getByRole('button', { name: '展开' }))

    expect(screen.getByText(/光源波长 λ/)).toBeInTheDocument()
    expect(screen.getByText(/单缝宽度 a/)).toBeInTheDocument()
    expect(screen.getByText(/双缝间距 d/)).toBeInTheDocument()
    expect(screen.getByText(/缝屏距 L/)).toBeInTheDocument()
    expect(screen.getByText(/理论条纹间距 Δx/)).toBeInTheDocument()
  })
})
