import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => (
    <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>
      {children}
    </div>
  ),
}))

vi.mock('../RotationalEmfRig3D', () => ({
  RotationalEmfRig3D: () => <div data-testid="rotational-emf-rig" />,
}))

import { RotationalEmfScene } from '../RotationalEmfScene'

describe('rotational-emf structure', () => {
  it('renders scenario controls, view toggles, and the readout card', () => {
    const { container } = render(<RotationalEmfScene />)

    expect(screen.getByRole('heading', { name: '旋转切割磁感线控制' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '旋转导体棒' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '旋转矩形线框' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '主视图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '俯视图' })).toBeInTheDocument()
    expect(screen.getByText('感应电动势')).toBeInTheDocument()
    expect(screen.getByTestId('rotational-emf-display')).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
    expect(screen.getByTestId('rotational-emf-rig')).toBeInTheDocument()

    expect(
      container.querySelector(
        '.rotational-emf-readout[data-presentation-signal~="live-metric"][data-presentation-signal~="interactive-readout"]',
      ),
    ).toBeInTheDocument()
  })

  it('updates labels when switching scenario and view mode', () => {
    render(<RotationalEmfScene />)

    fireEvent.click(screen.getByRole('button', { name: '旋转矩形线框' }))
    expect(screen.getByTestId('rotational-emf-scenario')).toHaveTextContent('旋转矩形线框')

    fireEvent.click(screen.getByRole('button', { name: '俯视图' }))
    expect(screen.getByTestId('rotational-emf-view')).toHaveTextContent('俯视图')
  })
})
