import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../MechanicalWaveGraphsRig3D', () => ({ MechanicalWaveGraphsRig3D: () => <div data-testid="mechanical-wave-graphs-rig" /> }))

import { MechanicalWaveGraphsScene } from '../MechanicalWaveGraphsScene'

describe('mechanical-wave-graphs structure', () => {
  it('renders the two graph model, controls, telemetry and chart', () => {
    render(<MechanicalWaveGraphsScene />)
    expect(screen.getByRole('heading', { name: '机械波的形成与图像演示' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '波长 λ' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '选中质点位置 xₚ' })).toBeInTheDocument()
    expect(screen.getByText('图像关系')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '机械波选中质点振动图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂停传播' })).toBeInTheDocument()
  })

  it('toggles velocity marker and pauses propagation', () => {
    render(<MechanicalWaveGraphsScene />)
    fireEvent.click(screen.getByRole('checkbox', { name: '显示质点速度方向' }))
    expect(screen.getByRole('checkbox', { name: '显示质点速度方向' })).not.toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: '暂停传播' }))
    expect(screen.getByRole('button', { name: '继续传播' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
