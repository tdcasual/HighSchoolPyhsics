import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../ForceCompositionRig3D', () => ({ ForceCompositionRig3D: () => <div data-testid="force-composition-rig" /> }))
import { ForceCompositionScene } from '../ForceCompositionScene'

describe('force-composition structure', () => {
  it('renders four modes, readout, chart and playback', () => {
    render(<ForceCompositionScene />)
    expect(screen.getByRole('heading', { name: '力的合成与分解' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '合成法则' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '合力范围' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '正交分解' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '按效果分解' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '分力 F₁' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重置参数' })).toBeInTheDocument()
    expect(screen.getByTestId('force-composition-rig')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '矢量大小对比' })).toBeInTheDocument()
  })

  it('switches to a scanning range mode and pauses the scan', () => {
    render(<ForceCompositionScene />)
    fireEvent.click(screen.getByRole('radio', { name: '合力范围' }))
    expect(screen.getByLabelText('夹角 θ')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '暂停扫描' }))
    expect(screen.getByRole('button', { name: '继续扫描' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
