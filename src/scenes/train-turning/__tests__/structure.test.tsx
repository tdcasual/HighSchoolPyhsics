import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../TrainTurningRig3D', () => ({ TrainTurningRig3D: () => <div data-testid="train-turning-rig" /> }))

import { TrainTurningScene } from '../TrainTurningScene'

describe('train-turning structure', () => {
  it('renders force controls, telemetry, chart and playback', () => {
    render(<TrainTurningScene />)
    expect(screen.getByRole('heading', { name: '火车转弯受力分析模型' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '实际速度 v' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /一键设为理想速度/ })).toBeInTheDocument()
    expect(screen.getByText('受力结论')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '火车转弯侧向力速度关系图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂停轨迹' })).toBeInTheDocument()
    expect(screen.getByTestId('train-turning-rig')).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
  })

  it('sets the ideal speed and pauses the trajectory', () => {
    render(<TrainTurningScene />)
    fireEvent.click(screen.getByRole('button', { name: /一键设为理想速度/ }))
    expect(screen.getByText('理想临界状态')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '暂停轨迹' }))
    expect(screen.getByRole('button', { name: '继续轨迹' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
