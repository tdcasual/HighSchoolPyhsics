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

vi.mock('../AlternatorRig3D', () => ({
  ALTERNATOR_DISPLAY_ROTATION_OFFSET_RAD: Math.PI / 2,
  AlternatorRig3D: () => <div data-testid="alternator-rig" />,
}))

import { AlternatorScene } from '../AlternatorScene'

describe('alternator structure', () => {
  it('renders controls, data overlay, chart, and playback in five-zone layout', () => {
    render(<AlternatorScene />)

    // Sidebar controls
    expect(screen.getByRole('heading', { name: '交流发电机控制' })).toBeInTheDocument()
    expect(screen.getByLabelText('转速 ω (rad/s)')).toBeInTheDocument()

    // Data overlay (floating panel)
    expect(screen.getByText('瞬时感应电压')).toBeInTheDocument()
    expect(screen.getByText('转速 ω')).toBeInTheDocument()

    // Chart (floating panel)
    expect(screen.getByText('U-t 图')).toBeInTheDocument()

    // Playback (floating panel)
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument()

    // Viewport
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
    expect(screen.getByTestId('alternator-rig')).toBeInTheDocument()
  })

  it('updates the speed readout and frameloop when playback pauses', () => {
    render(<AlternatorScene />)

    fireEvent.change(screen.getByLabelText('转速 ω (rad/s)'), { target: { value: '9' } })
    expect(screen.getByTestId('alternator-speed')).toHaveTextContent('9.00 rad/s')

    fireEvent.click(screen.getByRole('button', { name: '暂停' }))
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
