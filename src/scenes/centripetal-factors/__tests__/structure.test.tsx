import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../scene3d/InteractiveCanvas', () => ({ InteractiveCanvas: ({ children, frameloop }: { children: ReactNode; frameloop?: 'always' | 'demand' }) => <div data-testid="interactive-canvas" data-frameloop={frameloop ?? 'always'}>{children}</div> }))
vi.mock('../CentripetalFactorsRig3D', () => ({ CentripetalFactorsRig3D: () => <div data-testid="centripetal-factors-rig" /> }))

import { CentripetalFactorsScene } from '../CentripetalFactorsScene'

describe('centripetal-factors structure', () => {
  it('renders experiment controls, telemetry, chart and playback', () => {
    render(<CentripetalFactorsScene />)
    expect(screen.getByRole('heading', { name: '向心力演示仪' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '探究质量 m' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '1 : 1' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'ω₀' })).toBeInTheDocument()
    expect(screen.getByText('瞬时向心力计算公式')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '向心力控制变量关系图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暂停演示' })).toBeInTheDocument()
    expect(screen.getByTestId('centripetal-factors-rig')).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'always')
  })

  it('changes preset and pauses animation', () => {
    render(<CentripetalFactorsScene />)
    fireEvent.click(screen.getByRole('radio', { name: '探究角速度 ω' }))
    expect(screen.getByText('角速度 ω')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '暂停演示' }))
    expect(screen.getByRole('button', { name: '继续演示' })).toBeInTheDocument()
    expect(screen.getByTestId('interactive-canvas')).toHaveAttribute('data-frameloop', 'demand')
  })
})
