import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({
  InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => (
    <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div>
  ),
}))

vi.mock('../Oscilloscope3dRig3D', () => ({
  Oscilloscope3dRig3D: () => <div data-testid="oscilloscope-3d-rig" />,
}))

import { Oscilloscope3dScene } from '../Oscilloscope3dScene'

describe('oscilloscope-3d structure', () => {
  it('renders the four teaching modes, readout, chart and playback', () => {
    render(<Oscilloscope3dScene />)
    expect(screen.getByRole('heading', { name: '3D 示波器与波形测量' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '结构认知' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '扫描原理' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '波形测量' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'X-Y 合成' })).toBeInTheDocument()
    expect(screen.queryByText('荧光屏波形')).not.toBeInTheDocument()
    const expandButtons = screen.getAllByRole('button', { name: '展开' })
    expect(expandButtons).toHaveLength(2)
    fireEvent.click(expandButtons[0])
    expect(screen.getByText('荧光屏波形')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '展开' }))
    expect(screen.getByRole('button', { name: '暂停扫描' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
    expect(screen.getByTestId('oscilloscope-3d-rig')).toBeInTheDocument()
  })

  it('switches controls and chart mode without replacing the 3D viewport', () => {
    render(<Oscilloscope3dScene />)
    fireEvent.click(screen.getByRole('radio', { name: '波形测量' }))
    expect(screen.getByLabelText('VOLTS/DIV')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'X-Y 合成' }))
    expect(screen.getByLabelText('相位差')).toBeInTheDocument()
    expect(screen.getByTestId('oscilloscope-3d-rig')).toBeInTheDocument()
  })
})
