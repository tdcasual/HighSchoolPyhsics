import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../WaveStateRig3D', () => ({ WaveStateRig3D: () => <div data-testid="wave-state-rig" /> }))

import { WaveStateScene } from '../WaveStateScene'

describe('wave-state structure', () => {
  it('renders wave controls, telemetry, chart and playback', () => {
    render(<WaveStateScene />)
    expect(screen.getByRole('heading', { name: '简谐横波传播状态模型' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '向右传播' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '向左传播' })).toBeInTheDocument()
    expect(screen.getByLabelText('振幅 A')).toBeInTheDocument()
    const chartPanel = screen.getByRole('region', { name: '图表' })
    expect(chartPanel.querySelector('button[aria-label="展开"]')).toBeInTheDocument()
    fireEvent.click(chartPanel.querySelector('button[aria-label="展开"]')!)
    expect(screen.getByText('P 点位移—时间图像')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '简谐横波 P 点位移时间图' })).toBeInTheDocument()
    // Opens paused mid-way (front halfway to P) so there is a waveform to discuss.
    expect(screen.getByTestId('wave-state-sim-time')).toHaveTextContent('1.50 s')
    expect(screen.getByTestId('wave-state-probe-status')).toHaveTextContent('尚未起振')
    expect(screen.getByRole('button', { name: '继续传播' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '重置相位' }))
    expect(screen.getByTestId('wave-state-sim-time')).toHaveTextContent('0.00 s')
    expect(screen.getByTestId('wave-state-rig')).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })

  it('switches direction, toggles the ghost wave and pauses propagation', () => {
    render(<WaveStateScene />)
    fireEvent.click(screen.getByRole('radio', { name: '向左传播' }))
    expect(screen.getByRole('radio', { name: '向左传播' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('button', { name: '显示微平移虚线' }))
    expect(screen.getByRole('button', { name: '隐藏微平移虚线' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '开始传播' }))
    expect(screen.getByRole('button', { name: '暂停传播' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '暂停传播' }))
    expect(screen.getByRole('button', { name: '开始传播' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
