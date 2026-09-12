import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../ForceParallelogramRig3D', () => ({ ForceParallelogramRig3D: () => <div data-testid="force-parallelogram-rig" /> }))

import { ForceParallelogramScene } from '../ForceParallelogramScene'

describe('force-parallelogram structure', () => {
  it('renders experiment steps, readout, chart and playback', () => {
    render(<ForceParallelogramScene />)
    expect(screen.getByRole('heading', { name: '验证力的平行四边形定则' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '1 绘制分力' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '分力 F₁' })).toBeInTheDocument()
    expect(screen.getByText('实验结论')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '平行四边形定则合力夹角关系图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂停画面' })).toBeInTheDocument()
    expect(screen.getByTestId('force-parallelogram-rig')).toBeInTheDocument()
  })

  it('switches to synthesis and pauses the virtual experiment', () => {
    render(<ForceParallelogramScene />)
    fireEvent.click(screen.getByRole('radio', { name: '2 作平行四边形' }))
    fireEvent.click(screen.getByRole('button', { name: '暂停画面' }))
    expect(screen.getByRole('button', { name: '继续画面' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
